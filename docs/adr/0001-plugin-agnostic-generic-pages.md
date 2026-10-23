---
name: plugin-agnostic-generic-pages
description: Screens follow pulpcore concepts, not plugins; plugin differences are data; create/edit only for installed plugins.
status: Accepted
---

# 0001. One generic page per Pulp concept

## Context

Pulp has a dozen plugins (file, rpm, container, ansible, …) that share the same concepts:
remotes, repositories, publications, distributions, content and tasks. A screen per plugin
would multiply every page by the number of plugins and drift apart over time.

## Rules

- [ ] Each pulpcore concept has one list page that shows every plugin's objects together.
- [ ] Nothing in the navigation or the URL structure is specific to one plugin, except the
      plugin pages allowed by [0009](0009-plugin-actions.md).
- [ ] What differs per plugin (form fields, whether it can sync or publish, which content it
      holds, how content is changed or uploaded, extra actions) is declared as data per
      plugin, not built as separate screens.
- [ ] Per-plugin presentation (how a content unit or a repository's content looks) plugs into
      the generic pages; a plugin without one falls back to the generic view.
- [ ] Create and edit are offered only for plugins installed on the server.
- [ ] Objects of types the UI doesn't know still appear in lists, read-only.

## Consequences

- Supporting a new plugin is a data change, not a new section of the app.
- Users learn one workflow that works for every plugin.
