import { Agent } from "@cursor/sdk";

import type { IVendor, ToolAccess } from "../types.ts";

// Its default variant (not fast).
const MODEL = { id: "composer-2.5" };

const TOOLS_BY_ACCESS: Record<ToolAccess, string[]> = {
  none: [],
  read: ["read", "grep", "glob", "ls"],
};

// A local Cursor agent via the Cursor SDK, which authenticates with `CURSOR_API_KEY` or a stored
// login. Only project settings load (none without guidance), so user rules from the Cursor
// account don't steer it. No cost: the SDK's getUsage() isn't available on our account.
export const cursor: IVendor = {
  guidancePaths: [".cursor/"],
  async run({ prompt, cwd, tools, withGuidance, signal }) {
    const agent = await Agent.create({
      model: MODEL,
      tools: TOOLS_BY_ACCESS[tools],
      local: { cwd, settingSources: withGuidance ? ["project"] : [] },
    });
    let cancel = () => {};
    try {
      // An already-aborted signal never fires "abort", so check before starting.
      signal.throwIfAborted();
      const cursorRun = await agent.send(prompt);
      cancel = () => void cursorRun.cancel().catch(() => {});
      signal.addEventListener("abort", cancel, { once: true });

      const runResult = await cursorRun.wait();
      if (runResult.status !== "finished") {
        throw new Error(
          `agent run failed: ${runResult.status} ${runResult.error?.message ?? ""}`,
        );
      }
      return { answer: (runResult.result ?? "").trim() };
    } finally {
      signal.removeEventListener("abort", cancel);
      agent.close();
    }
  },
};
