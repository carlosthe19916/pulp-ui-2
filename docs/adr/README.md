# Architecture decision records

Each record is one UI design decision: the problem, the rules the UI follows, and what follows
from them. Records describe the product, never the code.

**For AI agents:** before changing a screen or a flow, pick the records that apply from their
`description` (`grep -H '^description:' docs/adr/0*.md`) and follow their `## Rules`. The
rules are a pass/fail checklist for how the running UI behaves. Where a rule maps to code, a
self-contained code rule in [.rulesync/rules/](../../.rulesync/rules/) restates it for the code,
and `/eval` checks both on every change.

To change a decision, add a new record with the next number, set the old one's `status` to
`Superseded by NNNN`, and update the code rules that cover the changed behaviour.

| #                                                | Decision                                                 |
| ------------------------------------------------ | -------------------------------------------------------- |
| [0001](0001-plugin-specifics-are-data.md)        | Plugin specifics are data, not screens                   |
| [0002](0002-navigation-and-domains.md)           | Navigation follows Pulp's areas; pages are domain-scoped |
| [0003](0003-detail-pages-and-expandable-rows.md) | Repository is the hub; which entities get a page         |
| [0004](0004-how-content-is-viewed.md)            | How content is viewed                                    |
| [0005](0005-how-content-is-changed.md)           | How content is changed                                   |
| [0006](0006-async-task-feedback.md)              | Long-running work is shown as tasks                      |
| [0007](0007-rest-api-only.md)                    | The UI uses only the Pulp REST API                       |
| [0008](0008-permission-aware-actions.md)         | Actions the user can't run are disabled, not hidden      |
| [0009](0009-relationship-views.md)               | Relationship graphs are an extra view (Proposed)         |
| [0009](0009-plugin-form-pages.md)                | Create and edit are per-plugin form pages                |

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
