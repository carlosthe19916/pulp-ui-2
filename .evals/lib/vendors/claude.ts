import { query } from "@anthropic-ai/claude-agent-sdk";

import type { IVendor, Tools } from "../types.ts";

const MODEL = "claude-opus-4-8";

// Hard limit per agent run, so a badly written case can't run away with money.
const MAX_USD = 1;

const TOOLS: Record<Tools, string[]> = {
  none: [],
  read: ["Read", "Glob", "Grep"],
};

// Claude Code via the Agent SDK. User settings and auto-memory never load, so only the repo's
// AI guidance steers it.
export const claude: IVendor = {
  guidance: [".claude/"],
  async run({ prompt, cwd, tools, guidance, signal }) {
    const abortController = new AbortController();
    signal.addEventListener("abort", () => abortController.abort(), {
      once: true,
    });
    const queryResult = query({
      prompt,
      options: {
        model: MODEL,
        cwd,
        settingSources: guidance ? ["project"] : [],
        settings: { autoMemoryEnabled: false },
        systemPrompt: { type: "preset", preset: "claude_code" },
        tools: TOOLS[tools],
        allowedTools: TOOLS[tools],
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
  },
};
