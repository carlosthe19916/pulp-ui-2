# AI guidance evals

Checks that the repo's AI guidance actually steers the agent: `AGENTS.md`, the rules
(`.rulesync/rules/` → `.claude/rules/`), skills, commands and project settings. It doesn't test
application code. A standalone package (like `website/`), run by hand:

```bash
cd .evals
npm ci
npm start                       # every case
npm start -- rules/placement    # agents-md + cases whose path contains the filter
EVAL_REPEAT=3 npm start         # run each case 3 times
npm run typecheck
```

Each run makes real model calls, using `ANTHROPIC_API_KEY` (and `ANTHROPIC_BASE_URL` if set).

Every case runs twice, each time in a throwaway copy of the working tree (uncommitted edits
included, `.evals/` excluded so the agent can't see the expected answers):

- **with guidance**: the copy keeps the repo's AI guidance; it must pass.
- **without guidance**: `AGENTS.md`, `.claude/`, `.cursor/`, `.agents/`, `.rulesync/` and
  `docs/adr/` are removed; it must fail. If it passes, the existing code or the base model teaches
  the behaviour, not the guidance.

## Layout

```
lib/agent.ts   runs the agent (Claude Agent SDK) in a copy of the repo
lib/judge.ts   model grader: scores 0–5 per criterion, passes at ≥ 4 on all
lib/types.ts   the Case shape
run.ts         runs cases/agents-md.ts first (the canary), then every other file under cases/
cases/
  agents-md.ts       AGENTS.md loads; if not, the rest is skipped
  <kind>/<name>.ts   one folder per kind of guidance, one file per thing it tests,
                     e.g. rules/placement.ts for .rulesync/rules/placement.md
```

Agent and judge both use `claude-opus-4-8` (`MODEL` in `lib/agent.ts`). The judge uses
structured outputs (`messages.parse` + `zodOutputFormat`); our Vertex org policy blocks them on
`claude-opus-5-5`, so check that before switching models.

## Adding a case

1. Create `cases/<kind>/<name>.ts` (copy `cases/rules/placement.ts`).
2. Write a task that needs the guidance but doesn't name it, so it loads the way it does in real
   use (a rule loads when the agent reads a file its `globs` match).
3. Take the `expect` criteria from the guidance itself; for a rule, its `## Checklist`.
4. Run it. If it fails only because the run without guidance passes, tighten the task.
