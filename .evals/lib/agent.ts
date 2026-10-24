import { existsSync } from "node:fs";
import { join } from "node:path";

import type { ITarget, IVendor, ToolAccess } from "./types.ts";
import { VENDORS } from "./vendors/index.ts";
import { repoRoot, withRepoCopy } from "./workspace.ts";

// Hard limit per agent run, so a badly written case can't run away with time.
const TIMEOUT_MS = 5 * 60_000;

// Never visible to the agent: the cases hold the expected answers.
const ALWAYS_HIDDEN = [".evals/"];

// The repo's AI guidance, removed from the copy except what the case targets: what every vendor
// reads (including rule sources and skills, which an agent with read tools could find), plus
// each vendor's own, so no vendor picks up another's guidance either.
const GUIDANCE_PATHS = [
  "AGENTS.md",
  "docs/adr/",
  ".rulesync/",
  ".agents/",
  ...Object.values(VENDORS).flatMap((vendor) => vendor.guidancePaths),
];

// The files a target keeps: its paths, each rule's source plus every vendor's copy of it, and
// each skill's source plus every vendor's link to it.
function targetPaths({ rules = [], skills = [], paths = [] }: ITarget) {
  const vendors = Object.values(VENDORS);
  const kept = [
    ...paths,
    ...rules.flatMap((name) => [
      `.rulesync/rules/${name}.md`,
      ...vendors.map((vendor) => vendor.rulePath(name)),
    ]),
    ...skills.flatMap((name) => [
      `.agents/skills/${name}/`,
      ...vendors.flatMap((vendor) => vendor.skillPath?.(name) ?? []),
    ]),
  ];
  // A typo would otherwise keep nothing and quietly test the case without its guidance.
  const missing = kept.filter((path) => !existsSync(join(repoRoot, path)));
  if (missing.length) {
    throw new Error(`target paths not found: ${missing.join(", ")}`);
  }
  return kept;
}

// One agent session in a copy of the repo, with only the target's guidance, or with none when
// there's no target.
export async function runAgent({
  vendor,
  prompt,
  tools,
  target,
}: {
  vendor: IVendor;
  prompt: string;
  tools: ToolAccess;
  target?: ITarget;
}) {
  return withRepoCopy(
    [...ALWAYS_HIDDEN, ...GUIDANCE_PATHS],
    target ? targetPaths(target) : [],
    (cwd) =>
      vendor.run({
        prompt,
        cwd,
        tools,
        withGuidance: target !== undefined,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }),
  );
}
