---
title: Content
sidebar_position: 6
---

# Content

A content unit is a single package, image or collection — an RPM, a Python wheel, a container
manifest. In Pulp content is **global and immutable**: a unit exists once and is referenced by the
repositories that contain it, so deleting a repository never deletes the bytes (orphan cleanup does).
The stored files themselves are **artifacts**, deduplicated by checksum.

Browse content under **Content Management → Content**: search and filter across all content units in
the current domain.

## What you can do

- **Filter** by type, by repository version, and compare versions (a **diff** of what was
  added/removed).
- Find **orphaned** content (not in any repository).
- Open a unit for its **Details**, its **Artifacts**, and the **Repositories** that reference it.
- Shortcuts: **Add to repository**, **Remove from this repository**, **Upload content**.

## See also

[Browse and search content](../browse-content.md) ·
[Host your packages](../host-your-packages.md) ·
[Core entities](../../concepts/entities.md)
