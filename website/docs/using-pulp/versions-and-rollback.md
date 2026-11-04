---
title: Versions and rollback
sidebar_position: 7
---

# Versions and rollback

Every change to a repository's content creates a new **immutable**
[repository version](../concepts/entities.md) — like an automatic, numbered snapshot on every
commit. Rollback and auditing come for free; there's no "undo my last sync" to fear.

## Work with versions

Open a repository → **Versions** tab. It lists every version and what changed between them. Open a
version for its content, and from the version's detail page:

| Action                | Does                                                         |
| --------------------- | ------------------------------------------------------------ |
| **Restore as latest** | Roll the repository back to this version (as a new version). |
| **Repair**            | Re-download or re-verify missing/corrupt artifacts.          |
| **Delete**            | Remove an old version you no longer need.                    |

If the version was scanned, a **vulnerability** alert appears on it — see
[Monitoring](../administration/monitoring.md).

## Keep versions tidy

Set **Retain repo versions** on the repository to auto-prune old ones (keep, say, the last 5).
Versions currently served by a [Distribution](./serve-content.md) are protected from pruning.

## Freeze what clients see

By default a Distribution serves the repository's latest version, so a sync changes what clients
get. To pin it, point the Distribution at a **specific version** (or a Publication). See
[Serve content](./serve-content.md).

## Reference

[Repositories](./reference/repositories.md).
