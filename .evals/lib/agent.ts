import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { query } from "@anthropic-ai/claude-agent-sdk";

export const MODEL = "claude-opus-4-8";

// Hard limits per agent run, so a badly written case can't run away with time or money.
const MAX_USD = 1;
const TIMEOUT_MS = 5 * 60_000;

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

// Never visible to the agent: the cases hold the expected answers.
const EVALS = [".evals/"];

// The repo's AI guidance, removed from the copy for `guidance: false`.
const GUIDANCE = ["AGENTS.md", ".claude/", "docs/adr/"];

// Copies still on disk, removed on exit too so Ctrl+C doesn't leave them behind.
const copies = new Set<string>();
const removeCopy = (dir: string) => {
  rmSync(dir, { recursive: true, force: true });
  copies.delete(dir);
};
process.on("exit", () => copies.forEach(removeCopy));
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.once(signal, () => process.exit(1));
}

// A throwaway copy of the working tree (uncommitted edits included, ignored files excluded),
// so the agent can't read what's dropped and can't touch the real checkout.
function copyRepo(drop: string[]) {
  const dir = mkdtempSync(join(tmpdir(), "pulp-ui-evals-"));
  copies.add(dir);
  const files = execFileSync(
    "git",
    ["ls-files", "-z", "-co", "--exclude-standard"],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  ).split("\0");
  for (const file of files) {
    if (!file || drop.some((d) => file.startsWith(d))) continue;
    // ls-files still lists tracked files deleted from the working tree.
    if (!existsSync(join(repoRoot, file))) continue;
    cpSync(join(repoRoot, file), join(dir, file), { recursive: true });
  }
  return dir;
}

// One Claude Code session in a copy of the repo. User settings and auto-memory never load, so
// only the repo's AI guidance steers it; `guidance: false` removes that guidance entirely.
export async function runAgent({
  prompt,
  tools,
  guidance = true,
}: {
  prompt: string;
  tools: string[];
  guidance?: boolean;
}) {
  const cwd = copyRepo(guidance ? EVALS : [...EVALS, ...GUIDANCE]);
  const abortController = new AbortController();
  const timer = setTimeout(() => abortController.abort(), TIMEOUT_MS);
  try {
    const queryResult = query({
      prompt,
      options: {
        model: MODEL,
        cwd,
        settingSources: guidance ? ["project"] : [],
        settings: { autoMemoryEnabled: false },
        systemPrompt: { type: "preset", preset: "claude_code" },
        tools,
        allowedTools: tools,
        maxTurns: 30,
        maxBudgetUsd: MAX_USD,
        abortController,
        persistSession: false,
      },
    });

    for await (const message of queryResult) {
      if (message.type === "result") {
        // An API error still arrives as subtype "success", flagged by is_error.
        if (message.subtype !== "success" || message.is_error) {
          throw new Error(
            `agent run failed: ${message.subtype} ${"result" in message ? message.result : ""}`,
          );
        }
        return {
          answer: message.result.trim(),
          costUsd: message.total_cost_usd,
        };
      }
    }

    throw new Error("agent run ended without a result");
  } finally {
    clearTimeout(timer);
    removeCopy(cwd);
  }
}
