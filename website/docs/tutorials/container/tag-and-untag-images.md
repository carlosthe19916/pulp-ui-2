---
title: Tag and untag images
sidebar_label: Tag and untag images
sidebar_position: 1
---

# Tag and untag images

**Goal:** move, add and remove the human-readable tags that point at an image manifest in a Pulp
container repository — the same thing you do in Docker Hub or Quay when you promote `:1.2.0` to
`:latest`.

Set up a repository first with the [Container registry tutorial](../container.mdx).

Container content (blobs, manifests, tags) is **read-only** in Pulp UI: images arrive only by
`podman push` or a sync. You never upload a manifest — you re-point tags at manifests that already
exist.

## Tag an image

A tag is a name that points at a manifest digest.

1. Open the repository → **Content → Browse** and copy the **digest** of the manifest you want to
   tag (for example `sha256:…`).
2. Repository **kebab (⋮) → Tag image**.
3. Enter the **Tag** name (for example `latest`) and the **Digest**, then confirm. It runs as a
   [task](../../using-pulp/monitor-tasks.md) and creates a new
   [repository version](../../using-pulp/versions-and-rollback.md).

## Untag an image

Removing a tag leaves the manifest in place; only the name goes away.

- Repository **kebab (⋮) → Untag image**, enter the **Tag** name, confirm — or
- **Content → Browse → Tags**, and use the **Untag** row action on the tag.

## Push repositories

A repository created by `podman push` (a **push repository**) has a few extra kebab actions,
because you manage its images from the registry side:

| Action                          | What it does                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------- |
| Remove image                    | Deletes a manifest by **digest** (and the tags pointing at it).                  |
| Remove signatures               | Drops signatures made with a given key.                                          |
| Convert to container repository | Migrates a push repository to a regular one so you can sync, copy and curate it. |

## Related

- [Copy images between repositories](./copy-images-between-repositories.md) — promotion.
- [Container registry tutorial](../container.mdx) · plugin docs:
  [pulp_container](https://pulpproject.org/pulp_container/)
