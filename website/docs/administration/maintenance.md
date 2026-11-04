---
title: Maintenance
sidebar_position: 14
---

# Maintenance

Housekeeping for a Pulp installation, under **System Management → Maintenance**.

## Orphan cleanup

Deleting a repository or version leaves its bytes behind until nothing references them. Run **orphan
cleanup** to delete content and artifacts no longer in any repository version and reclaim disk space.
It respects `retain_repo_versions` and never removes content still served by a
[distribution](../using-pulp/serve-content.md).

## Repair

Run **repair** to re-download or re-verify artifacts that are missing or corrupt — useful after
storage problems. You can also repair a single repository version from its detail page.

Both run as [tasks](../concepts/tasks.md). To see what's stored before cleaning up, check
[Storage](./storage.md).
