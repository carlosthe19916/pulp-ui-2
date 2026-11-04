---
title: Promote RPMs with advanced copy
sidebar_label: Promote with copy
sidebar_position: 4
---

# Promote RPMs with advanced copy

**Goal:** move tested packages from a staging repository into a release repository — a Dev → Prod promotion, without re-downloading anything.

Prerequisites: two RPM repositories, e.g. `rpm-staging` and `rpm-releases` (see the [RPM tutorial](../rpm.mdx) and [Promote content](../../using-pulp/promote-content.md)).

## Simple copy

Open the **target** repository → **Actions → Add content… → from another repository**, pick the source and the packages. Pulp copies references only — no file is uploaded or downloaded again.

## Advanced copy (with dependencies)

For packages whose dependencies must come along, use **Kebab (⋮) → Advanced copy**. It takes one JSON `config` — a list of copy instructions:

```json
[
  {
    "source_repo_version": "<href>",
    "dest_repo": "<href>",
    "content": ["<package href>"]
  }
]
```

Pulp resolves and copies the dependencies of the listed packages too, by reference. The result is a new [version](../../using-pulp/versions-and-rollback.md) of the destination repository.

:::info[Not yet in Pulp UI]
A visual package picker for advanced copy (choose packages from a list instead of pasting hrefs) — the way Artifactory's "copy with dependencies" works. For now, build the JSON `config` by hand or use the [Pulp CLI/API](https://pulpproject.org/pulp_rpm/docs/user/guides/copy-content/).
:::

## Related

- [Promote content](../../using-pulp/promote-content.md) · [Versions and rollback](../../using-pulp/versions-and-rollback.md)
