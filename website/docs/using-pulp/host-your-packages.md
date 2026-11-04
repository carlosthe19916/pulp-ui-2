---
title: Host your packages
sidebar_position: 3
---

# Host your packages

**Goal:** publish your own packages, images or files to Pulp — the equivalent of an Artifactory
**hosted** (local) repository.

## Upload (most ecosystems)

1. **Create a Repository** for your content type — **Content Management → Repositories → Create** —
   or open an existing one.
2. Click **Upload content**. A single, type-aware dialog takes the file (an RPM, a wheel, a `.gem`,
   a `.deb`, a tarball, …). The upload becomes [content](../concepts/entities.md), is added to the
   repository as a new [version](./versions-and-rollback.md), and is ready to
   [serve](./serve-content.md).
3. **Serve it** — [Serve content](./serve-content.md).

:::tip
Many clients can publish straight to Pulp instead of using the UI — `twine upload` (Python),
`npm publish`, `gem push`, `mvn deploy`. The matching [tutorial](../tutorials/index.md) shows the
client config.
:::

## Push (containers)

Container images aren't uploaded through the UI — you **push** them with your container tool, which
creates the repository on the fly:

```bash
podman push <pulp-host>/<base_path>:<tag>
```

See the [Container tutorial](../tutorials/container.mdx).

## Import (OSTree)

OSTree content arrives as a commit archive: use **Import archive** on the repository instead of
Upload. See the [OSTree tutorial](../tutorials/ostree.mdx).

## Reference

Full details: [Content](./reference/content.md), [Repositories](./reference/repositories.md).
