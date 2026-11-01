# AI guidance evals

Checks that the repo's AI guidance actually steers the agent: `AGENTS.md`, the ADRs, the rules
(`.rulesync/rules/` → `.claude/rules/`, `.cursor/rules/`), skills and project settings. A
standalone package (like `website/`), run by hand:

```bash
cd .evals
npm ci
npm start                       # every case, on every vendor
npm start -- rules/file-placement    # agents-md + cases whose path contains the filter
npm start -- --vendor cursor    # one vendor (repeat --vendor for several)
EVAL_REPEAT=3 npm start         # run each case 3 times
EVAL_CONCURRENCY=2 npm start    # case runs in flight per vendor (default 4)
npm run typecheck
```

Each run makes real model calls. The judge and the `claude` vendor use `ANTHROPIC_API_KEY` (and
`ANTHROPIC_BASE_URL` if set); the `cursor` vendor uses `CURSOR_API_KEY` or a stored Cursor SDK
login.

Every case runs twice, each time in a throwaway copy of the working tree (uncommitted edits
included, `.evals/` excluded so the agent can't see the expected answers):

- **target guidance only**: the copy keeps only the guidance the case's `target` names and
  removes the rest; it must pass. A pass means that guidance alone teaches the behaviour, not
  another guidance file. For a rule, the target keeps its source in `.rulesync/rules/` and every
  vendor's generated copy; for a skill, its source in `.agents/skills/` and every vendor's link
  to it. Vendors that report what loaded (Claude) must also have loaded each target rule and
  skill.
- **without guidance**: `AGENTS.md`, `docs/adr/`, `.rulesync/`, `.agents/` and every vendor's
  own guidance (`.claude/`, `.cursor/`) are removed; it must fail. If it passes, the existing
  code or the base model teaches the behaviour, not the guidance.

The application code stays in both copies: a rule loads only when the agent reads a file its
`globs` match. Neither run checks that the target works alongside the rest of the guidance, so
a conflict with another guidance file goes unnoticed.

## Layout

```
run.ts               per vendor, runs cases/agents-md.ts once (the canary), then every other file
                     under cases/ in parallel (EVAL_CONCURRENCY at a time); vendors run side by
                     side and each run prints its verdict when it finishes
lib/agent.ts         runs a vendor's agent in a copy of the repo, with a timeout
lib/workspace.ts     the throwaway copy of the working tree
lib/judge.ts         model grader: scores 0–5 per criterion, passes at ≥ 4 on all
lib/types.ts         the Case and Vendor shapes
lib/vendors/
  index.ts           every vendor, keyed by its --vendor name
  claude.ts          Claude Code (Claude Agent SDK)
  cursor.ts          Cursor (Cursor SDK, local agent)
cases/
  agents-md.ts       AGENTS.md loads; if not, that vendor's other cases are skipped
  <kind>/<name>.ts   one folder per kind of guidance, one file per thing it tests,
                     e.g. skills/vercel-composition-patterns.ts for .agents/skills/<name>/
  <kind>/<name>/     one file per case when a guidance file needs several, e.g.
                     rules/file-placement/{role-detail,component-context}.ts for
                     .rulesync/rules/file-placement.md
```

The judge always uses `claude-opus-4-8` (`MODEL` in `lib/judge.ts`), whichever vendor answered.
Each vendor sets its own agent model: `claude-opus-4-8` for Claude, `composer-2.5` for Cursor. Cursor
reports no cost (the SDK's usage API isn't available on our account), so its runs print
`cost n/a`. The judge uses structured outputs (`messages.parse` + `zodOutputFormat`); our Vertex
org policy blocks them on `claude-opus-5-5`, so check that before switching models.

## Vendors

A vendor is an object (`IVendor` in `lib/types.ts`), not a subclass: it holds only what is locked
to that agent, namely how to run it on a prompt in a directory, how the neutral `tools` level
(`"none"` or `"read"`) maps to its own tools, which guidance paths are its own, where its copy
of a rule lives, and, if it can tell, which guidance files loaded. The repo
copy, timeout, judge and report are shared and compose around it.

## Adding a vendor

1. Create `lib/vendors/<name>.ts` exporting an `IVendor` (copy `lib/vendors/cursor.ts`).
2. List it in `lib/vendors/index.ts`. `npm start` now runs it too; `--vendor <name>` runs it alone.
3. Run it on one case, e.g. `npm start -- --vendor <name> rules/file-placement` (the canary runs first).

## Adding a case

1. Create `cases/<kind>/<name>.ts`, or `cases/<kind>/<name>/<case>.ts` when the guidance needs
   several cases (copy `cases/rules/file-placement/role-detail.ts`).
2. Set `target` to the guidance it tests: `rules` and `skills` by name, `paths` for anything
   else. A rule is self-contained, so its target needs nothing besides the rule.
3. Write a task that needs the guidance but doesn't name it, so it loads the way it does in real
   use (a rule loads when the agent reads a file its `globs` match).
4. Take the `expect` criteria from the guidance itself; for a rule, its `## Checklist`.
5. Run it. If the run with only the target fails, the target is missing something another file
   supplies: add it to the target, or list that file in `paths`. If it fails only because the
   run without guidance passes, tighten the task.
