---
title: Prune packages and set retention
sidebar_label: Prune & retention
sidebar_position: 3
---

# Prune packages and set retention

**Goal:** keep a repository from growing forever — Pulp's equivalent of Artifactory cleanup policies.

Prerequisites: an RPM repository with content (see the [RPM tutorial](../rpm.mdx)).

## Prune old package versions (one-off)

1. Open the repository → **Kebab (⋮) → Prune packages**.
2. Set the fields:

   | Field       | Effect                                                   |
   | ----------- | -------------------------------------------------------- |
   | `keep_days` | Keep packages newer than this many days (default `14`).  |
   | `dry_run`   | Preview what would be removed without changing anything. |

3. Run with `dry_run` first; when it looks right, run it for real. Pruning keeps the newest of each package and makes a new [version](../../using-pulp/versions-and-rollback.md).

## Set ongoing retention (automatic)

In the **repository form** these caps apply on every change:

| Field                     | Keeps                                       |
| ------------------------- | ------------------------------------------- |
| `retain_repo_versions`    | Only the newest N repository versions.      |
| `retain_package_versions` | Only the newest N versions of each package. |
| `retain_checkpoints`      | How many checkpoint publications to keep.   |

Versions still served by a distribution are protected from pruning. To reclaim the disk space afterwards, an admin runs [orphan cleanup](../../administration/maintenance.md).

## Related

- [Versions and rollback](../../using-pulp/versions-and-rollback.md) · [Maintenance](../../administration/maintenance.md) · [Storage](../../administration/storage.md)
