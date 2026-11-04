---
title: Host your packages
sidebar_position: 3
---

# Host your packages

Publish your own packages, images or files to Pulp.

## Upload (most ecosystems)

1. **Create a Repository** for your content type (or open an existing one).
2. Use **Upload content** — a type-driven modal — to add a package. It becomes
   [content](../concepts/entities.md), is added to the repository (new version), and is ready to
   [serve](./serve-content.md).
3. Some clients can publish directly (for example `twine upload`, `npm publish`, `gem push`) —
   the [tutorials](../tutorials/index.md) show which.

## Push (containers)

Container images aren't uploaded — `podman push` / `docker push` to Pulp creates the repository.
See the [Container tutorial](../tutorials/container.mdx).

## Import (OSTree)

OSTree uses **Import archive** instead of upload. See the [OSTree tutorial](../tutorials/ostree.mdx).

:::note
Outline page — full walkthrough and screenshots to follow. Reference:
[Content](./reference/content.md), [Repositories](./reference/repositories.md).
:::
