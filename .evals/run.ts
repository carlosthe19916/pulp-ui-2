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
// Case runs in flight at once per vendor; vendors run side by side.
const concurrency = Number(process.env.EVAL_CONCURRENCY ?? 4);
if (!Number.isInteger(concurrency) || concurrency < 1) {
  throw new Error(
    `EVAL_CONCURRENCY must be a positive integer, got "${process.env.EVAL_CONCURRENCY}"`,
  );
}

let spentUsd = 0;
process.on("exit", () => console.log(`spent: ~$${spentUsd.toFixed(2)}`));

// Runs one model call and logs its time and estimated cost to `log`, printed with the run's
// verdict so parallel runs don't interleave. Vendors that don't report a cost add nothing.
async function timed<T extends { costUsd?: number }>(
  log: string[],
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
  log.push(`  ${label}: ${seconds}s, ${cost}`);
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

async function runCase(vendor: IVendor, evalCase: ICase, log: string[]) {
  const runAndJudge = async (withGuidance: boolean) => {
    const label = withGuidance ? "target guidance only" : "without guidance";
    const { answer, loadedGuidance } = await timed(log, `agent ${label}`, () =>
      runAgent({
        vendor,
        prompt: evalCase.prompt,
        tools: evalCase.tools ?? "none",
        target: withGuidance ? evalCase.target : undefined,
      }),
    );
    const { scores, comment } = await timed(log, `judge ${label}`, () =>
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

// Runs `tasks` with at most `limit` in flight.
async function pool(limit: number, tasks: (() => Promise<void>)[]) {
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) await tasks[next++]();
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker),
  );
}

// One run of a case; prints its verdict when done and returns whether it passed.
async function runOnce(vendorName: string, caseFile: string, run: number) {
  const evalCase: ICase = (await import(`./cases/${caseFile}`)).default;
  const title = `${vendorName} ${caseFile} #${run}`;
  console.log(`RUN  ${title}`);
  const log: string[] = [];
  // A run that throws (timeout, budget, auth, judge) fails this case, not the whole eval.
  const { pass, detail } = await runCase(
    VENDORS[vendorName],
    evalCase,
    log,
  ).catch((error) => ({ pass: false, detail: `  error: ${error.message}` }));
  console.log(
    `${pass ? "PASS" : "FAIL"} ${title}\n${log.join("\n")}\n\n${detail}\n`,
  );
  return pass;
}

// agents-md.ts is the canary: it runs once per vendor before that vendor's other cases, because
// if AGENTS.md doesn't load, no other result means anything. Each vendor gets its own canary, so
// one failing doesn't skip the others.
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

// Resolves to whether every run of this vendor passed.
async function runVendor(vendorName: string) {
  if (!(await runOnce(vendorName, CANARY, 1))) {
    console.error(`${vendorName}: ${CANARY} failed, skipping its other cases`);
    return false;
  }
  let passed = true;
  await pool(
    concurrency,
    caseFiles.flatMap((caseFile) =>
      Array.from({ length: repeat }, (_, i) => async () => {
        passed = (await runOnce(vendorName, caseFile, i + 1)) && passed;
      }),
    ),
  );
  return passed;
}

const results = await Promise.all(vendorNames.map(runVendor));
process.exitCode = results.every(Boolean) ? 0 : 1;
