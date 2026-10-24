---
description: Verify changed code against the convention rules in .rulesync/rules/
---

Verify that the code follows this repo's convention rules in `.rulesync/rules/`, and
through them the UI design decisions in `docs/adr/`. `npm run rules` generates
`.claude/rules/` and `.cursor/rules/` from those sources.

## Scope

Default target: the working-tree changes — `git status --short`, `git diff`, and
untracked files. `$ARGUMENTS` can narrow or redirect the target:

- a rule name (see `grep -H '^name:' .rulesync/rules/*.md`) → check all relevant files against that rule
- a path or glob → check those files
- a PR number / branch / commit range → check that diff

## Selecting the rules

Routing is **self-describing**: each `.rulesync/rules/*.md` declares its `globs` and
`description` in frontmatter. Don't maintain a mapping here — derive it. Read only the
frontmatter to choose, not the bodies:

```bash
git status --short                            # the changed files
grep -H '^globs:' .rulesync/rules/*.md        # which files each rule covers
grep -H '^description:' .rulesync/rules/*.md  # what each one covers
```

A rule is in scope when a target file matches one of its `globs` (`**` spans
directories). If none matches, say so.

Each rule ends with a `## Checklist` — use those items as the pass/fail rubric.

A rule whose frontmatter has `implements:` realises those ADRs in code. Also give
the subagent the `## Rules` of each listed ADR: when a change does something the
rule's checklist doesn't cover, judge it against those rules (the ADR wins).

## Generated rules

Always run `npm run rules:check`. A non-zero exit means `.claude/rules/` or
`.cursor/rules/` is stale or hand-edited: report it as a VIOLATION with the fix
"run `npm run rules`".

## How to run it

Delegate the file reading to a subagent (Explore or general-purpose) so the rule
text and every file it reads stay OUT of this conversation's context. Give the
subagent the relevant rule's checklist verbatim and the list of in-scope files;
ask it back for only the verdict.

## Report format

For each matched rule, report **only**:

- `PASS — <rule>` for each satisfied rule, or
- `VIOLATION — <rule>` with `file:line` and the one-line fix.

If no changed file matches any rule, say so explicitly. Do not restate the rule
prose. Do not fix anything unless asked — this command verifies.
