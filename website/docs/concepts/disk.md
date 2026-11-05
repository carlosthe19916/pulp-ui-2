---
title: Disk
description: Deleting a repository does not free bytes. Orphan cleanup does, and it will not remove content a distribution is still serving.
sidebar_label: Disk
sidebar_position: 6
---

# Disk

Content is global. Deleting a repository or a repository version removes the reference, not the bytes. The artifacts stay until nothing points at them.

**Orphan cleanup** deletes content and artifacts that no repository version references. It respects version retention and never removes content a distribution is still serving. Run it after a large prune or after deleting repositories you no longer serve.

**Repair** re-downloads or re-verifies artifacts that are missing or corrupt, for example after a storage failure. That is a different operation from regenerating an ecosystem's metadata (Maven and Python each have a metadata repair that does not fetch bytes again).

**Artifacts** are the stored files, deduplicated by checksum. Several content units can share one artifact, so the artifact count is lower than the package count. Per-domain backends (local disk, S3, Azure) are configured on the [domain](./operating.md#domains).

Retention on a repository (`retain_repo_versions`, and for RPM `retain_package_versions`) drops old versions on each change. A version a distribution still points at is kept. See [What clients see](./what-clients-see.md).
