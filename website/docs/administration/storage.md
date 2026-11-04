---
title: Storage
sidebar_position: 11
---

# Storage

Inspect the stored bytes and in-progress uploads, under **System Management → Storage**.

## Tabs

- **Artifacts** — the deduplicated files on disk/object storage, by checksum. Several content units
  can share one artifact.
- **Uploads** — chunked uploads in progress or awaiting commit.

To reclaim space from content no longer in any repository, see
[Maintenance](./maintenance.md) (orphan cleanup). Per-domain storage backends are configured in
[Domains](./domains.md).

:::note
Outline page — full walkthrough and screenshots to follow.
:::
