// Usage: npm start [-- <filter>]   e.g. `npm start -- rules/placement`   (EVAL_REPEAT=n, default 1)
import { readdirSync } from "node:fs";

import { runAgent } from "./lib/agent.ts";
import { judge, PASS_SCORE } from "./lib/judge.ts";
import type { ICase } from "./lib/types.ts";

const filter = process.argv[2] ?? "";
const repeat = Number(process.env.EVAL_REPEAT ?? 1);
if (!Number.isInteger(repeat) || repeat < 1) {
  throw new Error(
    `EVAL_REPEAT must be a positive integer, got "${process.env.EVAL_REPEAT}"`,
  );
}

let spentUsd = 0;
process.on("exit", () => console.log(`spent: ~$${spentUsd.toFixed(2)}`));

// Runs one model step and prints its time and estimated cost.
async function step<T extends { costUsd: number }>(
  label: string,
  fn: () => Promise<T>,
) {
  const start = Date.now();
  const out = await fn();
  spentUsd += out.costUsd;
  const secs = Math.round((Date.now() - start) / 1000);
  console.log(`  ${label}: ${secs}s, ~$${out.costUsd.toFixed(2)}`);
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

async function runCase(c: ICase) {
  const attempt = async (guidance: boolean) => {
    const label = guidance ? "with guidance" : "without guidance";
    const { answer } = await step(`agent ${label}`, () =>
      runAgent({ prompt: c.prompt, tools: c.tools ?? [], guidance }),
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
// result means anything.
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
for (const name of [CANARY, ...names]) {
  const c: ICase = (await import(`./cases/${name}`)).default;
  for (let i = 1; i <= repeat; i++) {
    console.log(`RUN  ${name} #${i}`);
    const { pass, detail } = await runCase(c);
    console.log(`${pass ? "PASS" : "FAIL"} ${name} #${i}\n\n${detail}\n`);
    failed ||= !pass;
  }
  if (name === CANARY && failed) {
    console.error(
      `${CANARY} failed: AGENTS.md isn't loading, skipping the rest`,
    );
    break;
  }
}
process.exitCode = failed ? 1 : 0;
