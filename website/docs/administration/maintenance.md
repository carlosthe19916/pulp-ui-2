---
title: Maintenance
sidebar_position: 14
---

# Maintenance

Housekeeping for a Pulp installation, under **System Management → Maintenance**.

## Common tasks

- **Orphan cleanup** — delete content and artifacts no longer referenced by any repository version,
  reclaiming disk space.
- **Repair** — re-download or re-verify missing/corrupt artifacts.

Both run as [tasks](../concepts/tasks.md). Orphan cleanup respects `retain_repo_versions` and
protects content still served by a distribution. To inspect stored bytes first, see
[Storage](./storage.md).

:::note
Outline page — full walkthrough and screenshots to follow.
:::
