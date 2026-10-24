// Usage: see README.md.
import { readdirSync } from "node:fs";
import { parseArgs } from "node:util";

import { runAgent } from "./lib/agent.ts";
import { judge, PASS_SCORE } from "./lib/judge.ts";
import type { ICase, IVendor } from "./lib/types.ts";
import { VENDORS } from "./lib/vendors/index.ts";

const {
  values: { vendor: vendorFlags },
  positionals,
} = parseArgs({
  allowPositionals: true,
  options: { vendor: { type: "string", multiple: true } },
});
const filter = positionals[0] ?? "";
// Every vendor unless --vendor picks some.
const vendorNames = vendorFlags ?? Object.keys(VENDORS);
for (const name of vendorNames) {
  if (!Object.hasOwn(VENDORS, name)) {
    throw new Error(
      `unknown vendor "${name}", expected one of: ${Object.keys(VENDORS).join(", ")}`,
    );
  }
}
const repeat = Number(process.env.EVAL_REPEAT ?? 1);
if (!Number.isInteger(repeat) || repeat < 1) {
  throw new Error(
    `EVAL_REPEAT must be a positive integer, got "${process.env.EVAL_REPEAT}"`,
  );
}

let spentUsd = 0;
process.on("exit", () => console.log(`spent: ~$${spentUsd.toFixed(2)}`));

// Runs one model call and prints its time and estimated cost.
// Vendors that don't report a cost add nothing to the total.
async function timed<T extends { costUsd?: number }>(
  label: string,
  run: () => Promise<T>,
) {
  const start = Date.now();
  const result = await run();
  spentUsd += result.costUsd ?? 0;
  const seconds = Math.round((Date.now() - start) / 1000);
  const cost =
    result.costUsd === undefined
      ? "cost n/a"
      : `~$${result.costUsd.toFixed(2)}`;
  console.log(`  ${label}: ${seconds}s, ${cost}`);
  return result;
}

// An indented block: one aligned line per criterion score, then the judge's comment.
function formatVerdict(
  title: string,
  scores: Record<string, number>,
  comment: string,
) {
  const width = Math.max(
    ...Object.keys(scores).map((criterion) => criterion.length),
  );
  return [
    `  ${title}`,
    ...Object.entries(scores).map(
      ([criterion, score]) => `    ${criterion.padEnd(width)}  ${score}/5`,
    ),
    "",
    ...comment
      .trim()
      .split("\n")
      .map((line) => (line ? `    ${line}` : "")),
  ].join("\n");
}

async function runCase(vendor: IVendor, evalCase: ICase) {
  const runAndJudge = async (withGuidance: boolean) => {
    const label = withGuidance ? "target guidance only" : "without guidance";
    const { answer, loadedGuidance } = await timed(`agent ${label}`, () =>
      runAgent({
        vendor,
        prompt: evalCase.prompt,
        tools: evalCase.tools ?? "none",
        target: withGuidance ? evalCase.target : undefined,
      }),
    );
    const { scores, comment } = await timed(`judge ${label}`, () =>
      judge({ criteria: evalCase.expect, task: evalCase.prompt, answer }),
    );
    // A target rule or skill that never loaded can't be what taught the answer. Only checked
    // when the vendor reports what loaded.
    const { rules = [], skills = [] } = evalCase.target;
    const unloaded =
      withGuidance && loadedGuidance
        ? [
            ...rules.map((name) => vendor.rulePath(name)),
            ...skills.flatMap((name) => vendor.skillPath?.(name) ?? []),
          ].filter((path) => !loadedGuidance.includes(path))
        : [];
    const verdict = formatVerdict(
      `${label} (must ${withGuidance ? "pass" : "fail"})`,
      scores,
      comment,
    );
    return {
      pass:
        Object.values(scores).every((score) => score >= PASS_SCORE) &&
        !unloaded.length,
      detail: unloaded.length
        ? `${verdict}\n\n    never loaded: ${unloaded.join(", ")}`
        : verdict,
    };
  };
  const withGuidance = await runAndJudge(true);
  if (!withGuidance.pass) return withGuidance;

  const withoutGuidance = await runAndJudge(false);
  return {
    pass: !withoutGuidance.pass,
    detail: `${withGuidance.detail}\n\n${withoutGuidance.detail}`,
  };
}

// agents-md.ts is the canary: it always runs first, because if AGENTS.md doesn't load, no other
// result means anything. Each vendor gets its own canary, so one failing doesn't skip the others.
const CANARY = "agents-md.ts";
const caseFiles = readdirSync(new URL("./cases/", import.meta.url), {
  recursive: true,
  encoding: "utf8",
})
  .filter(
    (file) => file.endsWith(".ts") && file !== CANARY && file.includes(filter),
  )
  .sort();
if (filter && !caseFiles.length) {
  throw new Error(`no case matches "${filter}"`);
}

let failed = false;
for (const vendorName of vendorNames) {
  const vendor = VENDORS[vendorName];
  let vendorFailed = false;
  for (const caseFile of [CANARY, ...caseFiles]) {
    const evalCase: ICase = (await import(`./cases/${caseFile}`)).default;
    for (let run = 1; run <= repeat; run++) {
      console.log(`RUN  ${vendorName} ${caseFile} #${run}`);
      // A run that throws (timeout, budget, auth, judge) fails this case, not the whole eval.
      const { pass, detail } = await runCase(vendor, evalCase).catch(
        (error) => ({ pass: false, detail: `  error: ${error.message}` }),
      );
      console.log(
        `${pass ? "PASS" : "FAIL"} ${vendorName} ${caseFile} #${run}\n\n${detail}\n`,
      );
      vendorFailed ||= !pass;
    }
    if (caseFile === CANARY && vendorFailed) {
      console.error(
        `${vendorName}: ${CANARY} failed, skipping its other cases`,
      );
      break;
    }
  }
  failed ||= vendorFailed;
}
process.exitCode = failed ? 1 : 0;
