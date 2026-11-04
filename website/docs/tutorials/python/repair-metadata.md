---
title: Repair Python package metadata
sidebar_label: Repair metadata
sidebar_position: 5
---

# Repair Python package metadata

**Goal:** rebuild the metadata Pulp serves for a repository's packages when it has drifted or
become corrupt — without re-uploading anything or cutting a new version.

Set up a Python repository first with the [Python tutorial](../python.mdx).

## Steps

1. Open the repository under **Content Management → Repositories**.
2. From the repository kebab, choose **Repair metadata** (no options).
3. It runs as a [task](../../using-pulp/monitor-tasks.md). Pulp regenerates each package's metadata
   in place; the repository version is unchanged.

Run this after a plugin upgrade that changes metadata handling, or if clients report metadata that
doesn't match the packages.

:::note
This repairs **Python package metadata**. To re-download missing or corrupt package files, use the
version-level **Repair** instead — see [Versions and rollback](../../using-pulp/versions-and-rollback.md).
:::

## Related

- [Versions and rollback](../../using-pulp/versions-and-rollback.md)
- [Repositories reference](../../using-pulp/reference/repositories.md)
- Plugin reference: [pulp_python](https://pulpproject.org/pulp_python/)
