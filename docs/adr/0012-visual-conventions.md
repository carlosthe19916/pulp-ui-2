---
name: visual-conventions
description: PatternFly everywhere; empty states carry no actions; no red on menu/row actions, red only on irreversible delete confirms; confirmations explain effects.
status: Accepted
---

# 0012. Empty states, confirmations and colour

## Context

Small, repeated choices make the UI feel consistent or not.

## Rules

- [ ] PatternFly components and patterns for everything; no custom styling where a component
      exists.
- [ ] Empty states only say what is empty ("No content in my-files yet") and carry no actions;
      the actions already sit in the toolbar or header menu. Error pages are the exception
      (retry, go home).
- [ ] Row actions, menu items and toolbar buttons are never red, including Delete, Remove and
      Cancel.
- [ ] The confirm button of an irreversible delete is the only red element. Reversible or
      non-destructive confirmations (content removal, version actions, cancelling a task) use
      a primary button.
- [ ] Confirmations say what happens and what doesn't ("This creates a new version without
      them. Older versions keep them."). Emptying a repository asks the user to type its name.
- [ ] An unknown or forbidden object shows an error or unauthorized state in place of the page.

## Consequences

- Each action has one place, and screens stay calm.
