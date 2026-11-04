---
title: Mirror an upstream
sidebar_position: 2
---

# Mirror an upstream

Proxy a public registry (PyPI, Docker Hub, a Fedora mirror, …) so your tools pull through Pulp.

## Steps

1. **Create a Remote** — **Content Management → Remotes → Create**. Pick the content type, set the
   upstream URL, credentials and a [download policy](../concepts/download-policies.md)
   (`on_demand` is usual for large upstreams).
2. **Create a Repository** of the same type and **Sync** it from the Remote. The sync runs as a
   [task](./monitor-tasks.md); each sync that changes content makes a new
   [version](./versions-and-rollback.md).
3. **Serve it** — see [Serve content](./serve-content.md).

## Cache vs mirror vs pull-through

- **On-demand sync** — fetch metadata now, packages on first request. Good default.
- **Mirror (complete)** — bit-for-bit copy of the upstream, including removals.
- **Pull-through cache** — skip the sync entirely; attach the Remote to a Distribution and Pulp
  caches on first request. Supported by some ecosystems — see
  [Download policies](../concepts/download-policies.md).

## Per-ecosystem

Each [tutorial](../tutorials/index.md) shows the exact Remote fields and policy for its ecosystem.

:::note
Outline page — full walkthrough and screenshots to follow. Reference: [Remotes](./reference/remotes.md).
:::
