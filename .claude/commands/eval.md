---
description: Verify changed code against the convention specs in evals/
---

Verify that the code follows this repo's convention specs in `evals/`.

## Scope

Default target: the working-tree changes — `git status --short`, `git diff`, and
untracked files. `$ARGUMENTS` can narrow or redirect the target:

- a spec name (`queries`, `toastr`, `forms`, `signatures`) → check all relevant files against that spec
- a path or glob → check those files
- a PR number / branch / commit range → check that diff

## Selecting the specs

Routing is **self-describing**: each `evals/*.md` declares its own `globs` and
`description` in frontmatter. Don't maintain a mapping here — derive it.

- **Default (working-tree changes)** — run the selector:

  ```bash
  .claude/hooks/eval-select.sh
  ```

  Each printed path is an in-scope spec (it matched a changed file via the spec's
  `globs`). If it prints nothing, no spec applies — say so and still mark
  completion.

- **By intent / `$ARGUMENTS`** — the frontmatter is the cheap, Skills-style
  index; read only it to choose, not the bodies:

  ```bash
  grep -H '^name:' evals/*.md         # the available specs
  grep -H '^description:' evals/*.md  # what each one covers
  ```

  A spec name (`queries` / `toastr` / `forms` / `signatures`) selects that spec; a
  path / glob / PR / branch / commit range narrows the target as before.

Each spec ends with a `## Checklist` — use those items as the pass/fail rubric.

## How to run it

Delegate the file reading to a subagent (Explore or general-purpose) so the spec
text and every file it reads stay OUT of this conversation's context. Give the
subagent the relevant spec's checklist verbatim and the list of in-scope files;
ask it back for only the verdict.

## Report format

For each matched spec, report **only**:

- `PASS — <rule>` for each satisfied rule, or
- `VIOLATION — <rule>` with `file:line` and the one-line fix.

If no changed file matches any spec, say so explicitly. Do not restate the spec
prose. Do not fix anything unless asked — this command verifies.

## Mark completion (required)

As the final step — whether the result was PASS, VIOLATION, or "no match" — run:

```bash
touch .claude/.eval-ran
```

This records that the current `client/src/` changes were verified. The Stop hook
(`.claude/hooks/eval-gate.sh`) reads this marker and will keep blocking the turn
from ending until it is newer than the latest change, so this step is what lets
the session finish.
