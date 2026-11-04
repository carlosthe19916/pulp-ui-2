---
title: Using Pulp
sidebar_label: Overview
sidebar_position: 1
---

# Using Pulp

This is the end-user guide: how to use Pulp UI the way you would use Artifactory or Nexus —
proxy an upstream, host your own packages, serve them at a URL, and point your tools at Pulp.
If Pulp's vocabulary is new to you, read [Concepts](../concepts/index.md) first.

Everything here happens under **Content Management** in the navigation, scoped to the
[domain](../concepts/domains.md) you select.

## The loop

```
Mirror ──▶ Host ──▶ Serve ──▶ Consume
```

| Step                                          | What you do                                                      |
| --------------------------------------------- | ---------------------------------------------------------------- |
| [Mirror an upstream](./mirror-an-upstream.md) | Proxy or sync a public registry (PyPI, Docker Hub, …) into Pulp. |
| [Host your packages](./host-your-packages.md) | Upload your own packages, images or files.                       |
| [Serve content](./serve-content.md)           | Publish a repository version and distribute it at a stable URL.  |
| [Consume content](./consume-content.md)       | Point `pip`, `dnf`, `podman`, `npm`, … at Pulp.                  |

## Beyond the loop

- [Browse and search content](./browse-content.md) — see what's inside a repository.
- [Versions and rollback](./versions-and-rollback.md) — every change is an immutable snapshot.
- [Promote content](./promote-content.md) — move content from Dev to Staging to Prod.
- [Monitor tasks](./monitor-tasks.md) — follow syncs, publishes and deletions.

## Reference

Per-entity pages for each thing you manage:
[Remotes](./reference/remotes.md),
[Repositories](./reference/repositories.md),
[Publications](./reference/publications.md),
[Distributions](./reference/distributions.md),
[Content](./reference/content.md).

:::info
Most operations (syncs, uploads, deletions) run as background tasks. Pulp UI shows their progress
next to the affected resource and in the task drawer. See [Monitor tasks](./monitor-tasks.md).
:::

## For a specific ecosystem

To set Pulp up end-to-end for one package ecosystem, follow its
[tutorial](../tutorials/index.md) (Maven, npm, Python, Container, RPM, …).
