import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { IVendor } from "../types.ts";

// Cursor can't run claude-opus-4-8; this is the closest model it offers.
const MODEL = "claude-4.6-opus-high";

// The Cursor CLI (`cursor-agent`), headless. Ask mode keeps it read-only, but it can't turn its
// read tools off (a project cli.json deny on Read is ignored), so a "none" case fails the run
// if the agent used any tool. User rules from the Cursor account still apply.
export const cursor: IVendor = {
  guidance: [".cursor/"],
  async run({ prompt, cwd, tools, signal }) {
    const { stdout } = await promisify(execFile)(
      "cursor-agent",
      [
        ...["--print", "--output-format", "stream-json", "--mode", "ask"],
        ...["--trust", "--model", MODEL, "--workspace", cwd],
        ...["--", prompt],
      ],
      { cwd, signal, maxBuffer: 64 * 1024 * 1024 },
    ).catch((err) => {
      if (err.code === "ENOENT") {
        throw new Error(
          "cursor-agent not found: install the Cursor CLI and run `cursor-agent login`",
        );
      }
      throw err;
    });

    // One JSON event per line: tool calls as they start, then a single result.
    const events = stdout
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    const used = events
      .filter((e) => e.type === "tool_call" && e.subtype === "started")
      .map((e) => Object.keys(e.tool_call)[0]);
    if (tools === "none" && used.length) {
      throw new Error(`agent used tools the case doesn't allow: ${used}`);
    }

    const result = events.find((e) => e.type === "result");
    if (!result) throw new Error("agent run ended without a result");
    if (result.subtype !== "success" || result.is_error) {
      throw new Error(`agent run failed: ${result.subtype} ${result.result}`);
    }
    return { answer: result.result.trim() };
  },
};
