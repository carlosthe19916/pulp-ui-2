---
title: Block packages from a Python repository
sidebar_label: Blocklist packages
sidebar_position: 1
---

# Block packages from a Python repository

**Goal:** stop specific Python packages from entering a repository — the way you'd use exclude
patterns in Artifactory or a curated PyPI index to keep known-bad or disallowed packages out.

Set up a Python repository first with the [Python tutorial](../python.mdx).

## Block a package

1. Open the repository under **Content Management → Repositories** and select the **Blocklist** tab.
2. Choose **Block a package** and fill in what to block:

   | Field      | Meaning                                                 |
   | ---------- | ------------------------------------------------------- |
   | `name`     | The project to block (for example `insecure-pkg`).      |
   | `version`  | Optional. A specific version; leave empty to block all. |
   | `filename` | Optional. A single distribution file.                   |

3. Save. The entry appears in the list.

A blocked package is **skipped on sync** and **refused on upload**, so it can never land in the
repository — even if it exists upstream on PyPI.

## Remove a block

Select the entry in the **Blocklist** tab and remove it. The package can be synced or uploaded
again on the next operation.

## Related

- [Curate a PyPI mirror with filters](./curate-mirror-with-filters.md) — control what you pull in
  the first place.
- [Browse and search content](../../using-pulp/browse-content.md)
- Plugin reference: [pulp_python package policies](https://pulpproject.org/pulp_python/)
