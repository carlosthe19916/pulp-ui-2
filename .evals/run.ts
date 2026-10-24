// Usage: npm start [-- [--vendor <name>]... [<filter>]]   (EVAL_REPEAT=n, default 1)
//   e.g. `npm start -- rules/placement`, `npm start -- --vendor cursor`
import { readdirSync } from "node:fs";
import { parseArgs } from "node:util";

import { runAgent } from "./lib/agent.ts";
import { judge, PASS_SCORE } from "./lib/judge.ts";
import type { ICase, IVendor } from "./lib/types.ts";
import { VENDORS } from "./lib/vendors/index.ts";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { vendor: { type: "string", multiple: true } },
});
const filter = positionals[0] ?? "";
// Every vendor unless --vendor picks some.
const vendorNames = values.vendor ?? Object.keys(VENDORS);
for (const name of vendorNames) {
  if (!(name in VENDORS)) {
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

// Runs one model step and prints its time and estimated cost.
// Vendors that don't report a cost add nothing to the total.
async function step<T extends { costUsd?: number }>(
  label: string,
  fn: () => Promise<T>,
) {
  const start = Date.now();
  const out = await fn();
  spentUsd += out.costUsd ?? 0;
  const secs = Math.round((Date.now() - start) / 1000);
  const cost =
    out.costUsd === undefined ? "cost n/a" : `~$${out.costUsd.toFixed(2)}`;
  console.log(`  ${label}: ${secs}s, ${cost}`);
  return out;
}

// An indented block: one aligned line per criterion score, then the judge's comment.
function verdict(
  title: string,
  scores: Record<string, number>,
  comment: string,
) {
  const width = Math.max(...Object.keys(scores).map((k) => k.length));
  return [
    `  ${title}`,
    ...Object.entries(scores).map(([k, s]) => `    ${k.padEnd(width)}  ${s}/5`),
    "",
    ...comment
      .trim()
      .split("\n")
      .map((line) => (line ? `    ${line}` : "")),
  ].join("\n");
}

async function runCase(vendor: IVendor, c: ICase) {
  const attempt = async (guidance: boolean) => {
    const label = guidance ? "with guidance" : "without guidance";
    const { answer } = await step(`agent ${label}`, () =>
      runAgent({
        vendor,
        prompt: c.prompt,
        tools: c.tools ?? "none",
        guidance,
      }),
    );
    const { scores, comment } = await step(`judge ${label}`, () =>
      judge({ criteria: c.expect, task: c.prompt, answer }),
    );
    return {
      pass: Object.values(scores).every((s) => s >= PASS_SCORE),
      detail: verdict(
        `${label} (must ${guidance ? "pass" : "fail"})`,
        scores,
        comment,
      ),
    };
  };
  const result = await attempt(true);
  if (!result.pass) return result;

  const control = await attempt(false);
  return {
    pass: !control.pass,
    detail: `${result.detail}\n\n${control.detail}`,
  };
}

// agents-md.ts is the canary: it always runs first, because if AGENTS.md doesn't load, no other
// result means anything. Each vendor gets its own canary, so one failing doesn't skip the others.
const CANARY = "agents-md.ts";
const names = readdirSync(new URL("./cases/", import.meta.url), {
  recursive: true,
  encoding: "utf8",
})
  .filter((f) => f.endsWith(".ts") && f !== CANARY && f.includes(filter))
  .sort();
if (filter && !names.length) {
  throw new Error(`no case matches "${filter}"`);
}

let failed = false;
for (const vendorName of vendorNames) {
  const vendor = VENDORS[vendorName];
  let vendorFailed = false;
  for (const name of [CANARY, ...names]) {
    const c: ICase = (await import(`./cases/${name}`)).default;
    for (let i = 1; i <= repeat; i++) {
      console.log(`RUN  ${vendorName} ${name} #${i}`);
      const { pass, detail } = await runCase(vendor, c);
      console.log(
        `${pass ? "PASS" : "FAIL"} ${vendorName} ${name} #${i}\n\n${detail}\n`,
      );
      vendorFailed ||= !pass;
    }
    if (name === CANARY && vendorFailed) {
      console.error(
        `${vendorName}: ${CANARY} failed, AGENTS.md isn't loading, skipping its other cases`,
      );
      break;
    }
  }
  failed ||= vendorFailed;
}
process.exitCode = failed ? 1 : 0;
