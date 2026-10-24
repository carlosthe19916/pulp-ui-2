import type { IVendor, ToolAccess } from "./types.ts";
import { VENDORS } from "./vendors/index.ts";
import { withRepoCopy } from "./workspace.ts";

// Hard limit per agent run, so a badly written case can't run away with time.
const TIMEOUT_MS = 5 * 60_000;

// Never visible to the agent: the cases hold the expected answers.
const ALWAYS_HIDDEN = [".evals/"];

// The repo's AI guidance, removed from the copy for runs without guidance: what every vendor
// reads (including rule sources and skills, which an agent with read tools could find), plus
// each vendor's own, so no vendor picks up another's guidance either.
const GUIDANCE_PATHS = [
  "AGENTS.md",
  "docs/adr/",
  ".rulesync/",
  ".agents/",
  ...Object.values(VENDORS).flatMap((vendor) => vendor.guidancePaths),
];

// One agent session in a copy of the repo, with or without the repo's guidance.
export async function runAgent({
  vendor,
  prompt,
  tools,
  withGuidance,
}: {
  vendor: IVendor;
  prompt: string;
  tools: ToolAccess;
  withGuidance: boolean;
}) {
  const hiddenPaths = withGuidance
    ? ALWAYS_HIDDEN
    : [...ALWAYS_HIDDEN, ...GUIDANCE_PATHS];
  return withRepoCopy(hiddenPaths, (cwd) =>
    vendor.run({
      prompt,
      cwd,
      tools,
      withGuidance,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }),
  );
}
