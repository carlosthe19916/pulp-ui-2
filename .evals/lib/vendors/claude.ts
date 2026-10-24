import { query } from "@anthropic-ai/claude-agent-sdk";

import type { IVendor, ToolAccess } from "../types.ts";

const MODEL = "claude-opus-4-8";

// Hard limits per agent run, so a badly written case can't run away with money.
const MAX_USD = 1;
const MAX_TURNS = 30;

const TOOLS_BY_ACCESS: Record<ToolAccess, string[]> = {
  none: [],
  read: ["Read", "Glob", "Grep"],
};

// Claude Code via the Agent SDK. User settings and auto-memory never load, so only the repo's
// AI guidance steers it. strictMcpConfig skips the project's MCP servers: `tools` doesn't limit
// MCP tools, and they'd load only in the run with guidance.
export const claude: IVendor = {
  guidancePaths: [".claude/"],
  async run({ prompt, cwd, tools, withGuidance, signal }) {
    const abortController = new AbortController();
    const abort = () => abortController.abort();
    signal.addEventListener("abort", abort, { once: true });
    try {
      const messages = query({
        prompt,
        options: {
          model: MODEL,
          cwd,
          settingSources: withGuidance ? ["project"] : [],
          settings: { autoMemoryEnabled: false },
          strictMcpConfig: true,
          systemPrompt: { type: "preset", preset: "claude_code" },
          tools: TOOLS_BY_ACCESS[tools],
          allowedTools: TOOLS_BY_ACCESS[tools],
          maxTurns: MAX_TURNS,
          maxBudgetUsd: MAX_USD,
          abortController,
          persistSession: false,
        },
      });

      for await (const message of messages) {
        if (message.type !== "result") continue;
        // An API error still arrives as subtype "success", flagged by is_error.
        if (message.subtype !== "success") {
          throw new Error(
            `agent run failed: ${message.subtype} ${message.errors.join("; ")}`,
          );
        }
        if (message.is_error) {
          throw new Error(`agent run failed: ${message.result}`);
        }
        return {
          answer: message.result.trim(),
          costUsd: message.total_cost_usd,
        };
      }

      throw new Error("agent run ended without a result");
    } finally {
      signal.removeEventListener("abort", abort);
    }
  },
};
