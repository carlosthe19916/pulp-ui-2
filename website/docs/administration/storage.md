---
title: Storage
sidebar_position: 11
---

# Storage

Inspect the stored bytes and in-progress uploads, under **System Management → Storage**.

## Tabs

- **Artifacts** — the actual files on disk or object storage, deduplicated by checksum. Several
  content units (even across repositories) can share one artifact, so the artifact count is lower
  than the package count.
- **Uploads** — chunked uploads that are in progress or awaiting commit, from large
  [uploads](../using-pulp/host-your-packages.md).

## Reclaiming space

Deleting a repository or version does **not** delete bytes — artifacts linger until nothing
references them. To free that space, run orphan cleanup from [Maintenance](./maintenance.md).
Per-domain storage backends (local, S3, Azure) are configured in [Domains](./domains.md).
