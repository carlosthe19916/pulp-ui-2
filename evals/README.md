# Agent harness evals

Regression tests for **`AGENTS.md`**, **`.rulesync/rules/`** (and the generated
`.claude/rules/` / `.cursor/rules/`), and optionally **skills** — not for
application code.

|        | `/eval` (Claude Code command)           | `npm run eval:harness`                        |
| ------ | --------------------------------------- | --------------------------------------------- |
| Asks   | Does **changed code** follow the rules? | Do the **rules / AGENTS.md** steer the agent? |
| Input  | Working-tree diff                       | Fixed prompts in `evals/cases/`               |
| Grader | Rule `## Checklist`                     | Per-case `check.sh` on structured JSON        |

## Quick start

```bash
# Validate case layout only (no model calls)
npm run eval:harness -- --validate

# Current harness only (cheaper while iterating)
npm run eval:harness -- --arms current

# Current vs baseline (guidance stripped) — proves the rules contribute
npm run eval:harness -- --arms current,baseline

# One case
npm run eval:harness -- --case canary --arms current
```

Requires the `claude` CLI (`claude /login` or `ANTHROPIC_API_KEY`). Each case is a
real model call billed to your plan.

## Layout

```
evals/
  README.md
  harness/
    run.sh          # orchestrator
    lib.sh          # shared helpers
  cases/
    <id>/
      meta.json     # id, description, targets, must_pass
      prompt.md     # task; must demand a single JSON object
      check.sh      # grades answer.json → exit 0 pass / non-zero fail
```

`targets` is documentation only (which rule / file the case protects). Graders stay
deterministic: parse JSON, assert fields — no LLM-as-judge in this suite.

## Arms

| Arm        | What the agent sees                                                            |
| ---------- | ------------------------------------------------------------------------------ |
| `current`  | This checkout, with `CLAUDE.md → AGENTS.md` and rules intact                   |
| `baseline` | Detached worktree with guidance removed; `claude --bare` so nothing auto-loads |

Agents may only `Read` files (no `Glob`/`Grep`) so baseline cannot rediscover
conventions by searching `client/src/`.

A case that passes on `current` and fails on `baseline` is the signal that the
harness (not the base model) is doing the work. If both arms pass, the prompt is
too easy — tighten it until it needs a **repo-specific** name or rule (see the
`forms-submit-error` fields `state_hook` / `alert_component`).

The **canary** must pass on `current`; if it fails, guidance did not load and
every other result is meaningless.

## Adding a case

1. Copy `cases/canary/` to `cases/<id>/`.
2. Write a prompt that only the repo guidance answers reliably; require **one JSON
   object** (no markdown fences).
3. Implement `check.sh` that reads `$1` (`answer.json`) and exits 0/1.
4. Set `"must_pass": true` only for canaries / never-regress cases.
5. Run `npm run eval:harness -- --case <id> --arms current,baseline`.

Prefer decision / convention questions over full coding tasks for cost. When you
need a coding case later: add a `base-commit` file and a `check.sh` that inspects
a worktree the agent edited — keep that out of this minimal suite until needed.

## Skills

Point `targets` at a skill name and mention the skill in the prompt when you add
skill cases. Baseline already drops `.claude/skills` so a with/without comparison
stays valid. There is no skill case in the starter set yet.

## Results

Runs write under `.build/agent-evals/` (gitignored): per-arm answers, grader logs,
and `summary.json`. The process exits non-zero only when the **`current`** arm
fails (baseline failures are expected when guidance matters). `summary.json`
includes a `deltas` map: `guidance_helps` vs `too_easy`.
