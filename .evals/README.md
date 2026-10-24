# AI guidance evals

Checks that the repo's AI guidance actually steers the agent: `AGENTS.md`, the rules
(`.rulesync/rules/` → `.claude/rules/`), skills, commands and project settings. It doesn't test
application code. A standalone package (like `website/`), run by hand:

```bash
cd .evals
npm ci
npm start                       # every case, on every vendor
npm start -- rules/placement    # agents-md + cases whose path contains the filter
npm start -- --vendor cursor    # one vendor (repeat --vendor for several)
EVAL_REPEAT=3 npm start         # run each case 3 times
npm run typecheck
```

Each run makes real model calls. The judge and the `claude` vendor use `ANTHROPIC_API_KEY` (and
`ANTHROPIC_BASE_URL` if set); the `cursor` vendor needs the Cursor CLI (`cursor-agent`), logged in
or with `CURSOR_API_KEY`.

Every case runs twice, each time in a throwaway copy of the working tree (uncommitted edits
included, `.evals/` excluded so the agent can't see the expected answers):

- **with guidance**: the copy keeps the repo's AI guidance; it must pass.
- **without guidance**: `AGENTS.md`, `docs/adr/` and every vendor's own guidance (`.claude/`,
  `.cursor/`) are removed; it must fail. If it passes, the existing code or the base model teaches
  the behaviour, not the guidance.

## Layout

```
lib/agent.ts       runs a vendor's agent in a copy of the repo, with a timeout
lib/workspace.ts   the throwaway copy of the working tree
lib/judge.ts       model grader: scores 0–5 per criterion, passes at ≥ 4 on all
lib/types.ts       the Case and Vendor shapes
lib/vendors/
  index.ts         every vendor, keyed by its --vendor name
  claude.ts        Claude Code (Claude Agent SDK)
  cursor.ts        Cursor (cursor-agent CLI, headless)
run.ts         runs cases/agents-md.ts first (the canary), then every other file under cases/
cases/
  agents-md.ts       AGENTS.md loads; if not, the rest is skipped
  <kind>/<name>.ts   one folder per kind of guidance, one file per thing it tests,
                     e.g. rules/placement.ts for .rulesync/rules/placement.md
```

The judge always uses `claude-opus-4-8` (`MODEL` in `lib/judge.ts`), whichever vendor answered.
Each vendor sets its own agent model: `claude-opus-4-8` for Claude, `claude-4.6-opus-high` for
Cursor (it doesn't offer 4.8). Cursor reports no cost, so its runs print `cost n/a`. The judge uses
structured outputs (`messages.parse` + `zodOutputFormat`); our Vertex org policy blocks them on
`claude-opus-5-5`, so check that before switching models.

## Vendors

A vendor is an object (`IVendor` in `lib/types.ts`), not a subclass: it holds only what is locked
to that agent, namely how to run it on a prompt in a directory, how the neutral `tools` level
(`"none"` or `"read"`) maps to its own tools, and which guidance paths are its own. The repo
copy, timeout, judge and report are shared and compose around it.

Known gaps: Cursor can't turn its read tools off, so on a `tools: "none"` case the run fails if it
used one; and user rules from the Cursor account still load.

## Adding a vendor

1. Create `lib/vendors/<name>.ts` exporting an `IVendor` (copy `lib/vendors/cursor.ts` for a CLI).
2. List it in `lib/vendors/index.ts`. `npm start` now runs it too; `--vendor <name>` runs it alone.
3. Run it on one case, e.g. `npm start -- --vendor <name> rules/placement` (the canary runs first).

## Adding a case

1. Create `cases/<kind>/<name>.ts` (copy `cases/rules/placement.ts`).
2. Write a task that needs the guidance but doesn't name it, so it loads the way it does in real
   use (a rule loads when the agent reads a file its `globs` match).
3. Take the `expect` criteria from the guidance itself; for a rule, its `## Checklist`.
4. Run it. If it fails only because the run without guidance passes, tighten the task.
