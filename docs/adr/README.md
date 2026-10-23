# Architecture decision records

Each record is one UI design decision: the problem, the rules the UI follows, and what follows
from them. Records describe the product, never the code.

**For AI agents:** before changing a screen or a flow, pick the records that apply from their
`description` (`grep -H '^description:' docs/adr/0*.md`) and follow their `## Rules`. The
rules are a pass/fail checklist for how the running UI behaves. Where a rule maps to code, an
eval in [evals/](../../evals/) declares `implements:` for that record and checks it on every
change.

To change a decision, add a new record with the next number, set the old one's `status` to
`Superseded by NNNN`, and update any eval that `implements:` it.

| #                                                     | Decision                                                 |
| ----------------------------------------------------- | -------------------------------------------------------- |
| [0001](0001-plugin-agnostic-generic-pages.md)         | One generic page per Pulp concept, for every plugin      |
| [0002](0002-navigation-and-domains.md)                | Navigation follows Pulp's areas; pages are domain-scoped |
| [0003](0003-detail-pages-and-expandable-rows.md)      | Repository is the hub; which entities get a page         |
| [0004](0004-content-surfaces.md)                      | Content is shown globally, per unit and per version      |
| [0005](0005-per-plugin-browse.md)                     | Each plugin browses content the way its ecosystem does   |
| [0006](0006-content-changes-target-latest-version.md) | Content changes create a version from the latest         |
| [0007](0007-upload.md)                                | One upload flow for every uploadable content type        |
| [0008](0008-async-task-feedback.md)                   | Long-running work is shown as tasks                      |
| [0009](0009-plugin-actions.md)                        | Plugin actions share one action form                     |
| [0010](0010-rest-api-only.md)                         | The UI uses only the Pulp REST API                       |
| [0011](0011-permission-aware-actions.md)              | Actions the user can't run are disabled, not hidden      |
| [0012](0012-visual-conventions.md)                    | Empty states, confirmations and colour                   |

## Template

```markdown
---
name: kebab-case-slug
description: One line an agent can match a change against.
status: Accepted
---

# NNNN. Title

## Context

What problem or constraint forces a decision.

## Rules

- [ ] Observable behaviour the UI must have. No code, file or component names.

## Consequences

What follows, good and bad.
```
