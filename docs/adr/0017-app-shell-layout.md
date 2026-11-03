---
name: app-shell-layout
description: The app shell is PatternFly's stable masthead plus a sidebar of expandable nav groups, not the beta docked nav.
status: Accepted
---

# 0017. The app shell is a masthead and an expandable sidebar

## Context

The docked navigation (a vertical masthead holding the nav and user tools) is a beta PatternFly
layout: its API and look can still change. The masthead with a sidebar of expandable groups is
PatternFly's stable, documented layout.

## Rules

- [ ] A horizontal masthead holds the sidebar toggle, the brand, and the tasks, help, theme and
      user menus.
- [ ] The sidebar lists the groups of [0002](0002-navigation-and-domains.md) as expandable
      sections; the current page's group opens on load and when navigation enters another
      group, and stays closed once the user closes it.
- [ ] On wide screens the sidebar starts open and remembers the user's toggle; on narrow screens
      it starts closed, overlays the page and closes after a page is picked.
- [ ] A closed sidebar can't be reached with the keyboard or a screen reader.

## Consequences

- The layout relies only on stable PatternFly components.
- A collapsed sidebar shows nothing; there is no icon-only rail.
