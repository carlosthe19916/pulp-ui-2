---
name: plugin-specifics-are-data
description: One generic page per pulpcore concept; every per-plugin difference (fields, capabilities, content, actions) is data, not a screen; plugin pages, tabs and actions appear only when the plugin is installed.
status: Accepted (create and edit forms superseded by 0010)
---

# 0001. Plugin specifics are data, not screens

## Context

Pulp has a dozen plugins (file, rpm, container, ansible, …) that share the same concepts:
remotes, repositories, publications, distributions, content and tasks. A screen per plugin would
multiply every page by the number of plugins and drift apart over time. Plugins also add many
actions (sign, tag, copy, prune, repair metadata, scan, rebuild…), and nearly all of them are
"fill a few fields, start a task".

## Rules

- [ ] Each pulpcore concept has one list page that shows every plugin's objects together.
      Nothing in the navigation or the URL structure is specific to one plugin, except the
      plugin pages below.
- [ ] What differs per plugin — whether it can sync or publish, which content it holds, how
      content is changed or uploaded, extra actions — is declared as data per plugin, not built
      as separate screens. Create and edit forms are per-plugin pages
      ([0010](0010-plugin-form-pages.md)).
- [ ] Per-plugin presentation (how a content unit or a repository's content looks) plugs into
      the generic pages; a plugin without one falls back to the generic view.
- [ ] Create and edit are offered only for plugins installed on the server. Objects of types the
      UI doesn't know still appear in lists, read-only.
- [ ] Each plugin action is declared as data: label, fields, and whether it applies to a
      repository or to a version. One shared action form renders every plugin action, and Sync,
      following [0006](0006-async-task-feedback.md).
- [ ] Plugin actions appear in the repository or version actions menu only for plugins that have
      them; a few also appear as row actions where their object is listed (e.g. untag on a tag).
- [ ] Plugin-only pages, tabs and reads that need a screen (Ansible collections, container
      namespaces, Python blocklist, Maven path index, vulnerability reports) appear only when
      that plugin is installed.

## Consequences

- Supporting a new plugin, or a new plugin action, is a data change, not a new section of the
  app. Users learn one workflow that works for every plugin.
- An action needing more than a form needs its own design (and record).
