---
name: plugin-actions
description: Plugin actions are data rendered by one shared action form; plugin-only pages/tabs appear only when the plugin is installed.
status: Accepted
---

# 0009. Plugin actions share one action form

## Context

Plugins add many actions (sign, tag, copy, prune, repair metadata, scan, rebuild…). All of
them are "fill a few fields, start a task".

## Rules

- [ ] Each plugin action is declared as data: label, fields, and whether it applies to a
      repository or to a version.
- [ ] One action form renders every plugin action, and Sync, and follows
      [0008](0008-async-task-feedback.md).
- [ ] Actions appear in the repository or version actions menu only for plugins that have them;
      a few also appear as row actions where their object is listed (e.g. untag on a tag).
- [ ] Plugin-only reads that need a screen (Ansible collections, container namespaces, Python
      blocklist, Maven path index, vulnerability reports) get a page or a tab that appears only
      when the plugin is installed.

## Consequences

- A new plugin action is a data change. An action needing more than a form needs its own
  design (and record).
