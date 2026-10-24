import type { IVendor, Tools } from "./types.ts";
import { VENDORS } from "./vendors/index.ts";
import { withRepoCopy } from "./workspace.ts";

// Hard limit per agent run, so a badly written case can't run away with time.
const TIMEOUT_MS = 5 * 60_000;

// Never visible to the agent: the cases hold the expected answers.
const EVALS = [".evals/"];

// The repo's AI guidance, removed from the copy for `guidance: false`: what every vendor reads,
// plus each vendor's own, so no vendor picks up another's guidance either.
const GUIDANCE = [
  "AGENTS.md",
  "docs/adr/",
  ...Object.values(VENDORS).flatMap((v) => v.guidance),
];

// One agent session in a copy of the repo; `guidance: false` removes the repo's guidance first.
export async function runAgent({
  vendor,
  prompt,
  tools,
  guidance = true,
}: {
  vendor: IVendor;
  prompt: string;
  tools: Tools;
  guidance?: boolean;
}) {
  return withRepoCopy(guidance ? EVALS : [...EVALS, ...GUIDANCE], (cwd) =>
    vendor.run({
      prompt,
      cwd,
      tools,
      guidance,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }),
  );
}
