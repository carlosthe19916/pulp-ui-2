---
title: Browse and search content
sidebar_position: 4
---

# Browse and search content

**Goal:** see exactly what's inside your repositories — like browsing the tree of an Artifactory
repo, but across the whole server.

## Two ways in

| View                             | Shows                                                      |
| -------------------------------- | ---------------------------------------------------------- |
| A repository's **Content** tab   | The content in its latest (or a chosen) version.           |
| **Content Management → Content** | Every content unit on the server, searchable across repos. |

## What you can do

- **Search and filter** by content type (package, image, collection, …).
- Find **orphaned** content — units not in any repository (candidates for
  [cleanup](../administration/maintenance.md)).
- Filter by **repository version**, and **diff** two versions to see what was added or removed.
- Open a content unit for its detail: the **Artifacts** (the stored files) and the
  **Repositories** that reference it.
- Act in place: **Add to repository**, **Remove from this repository**, or **Upload content**.

## Reference

Full details: [Content](./reference/content.md). For the entities behind this (content, artifacts,
versions), see [Core entities](../concepts/entities.md).
