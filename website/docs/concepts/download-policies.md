---
title: When bytes are fetched
description: Immediate, on-demand, streamed and pull-through, which ecosystems use each, and what breaks if the upstream disappears.
sidebar_label: When bytes are fetched
sidebar_position: 2
---

# When bytes are fetched

A remote's download policy decides when Pulp stores the package bytes. Pull-through is a different mechanism: the remote hangs off a distribution and the first client request fills the cache.

| Mode         | When the bytes arrive                                    | Use it when                                          |
| ------------ | -------------------------------------------------------- | ---------------------------------------------------- |
| `immediate`  | All of them at sync time.                                | The copy must work with the upstream offline.        |
| `on_demand`  | Metadata at sync; each file on first request, then kept. | A large distro or index you will not copy in full.   |
| `streamed`   | On request, and not stored.                              | Content you do not need to keep.                     |
| Pull-through | Nothing up front. The first client request downloads it. | A cache of a public registry, filled by real builds. |

The first client to request an on-demand or pull-through file pays the upstream round trip. Everyone after gets it from Pulp.

:::warning
On-demand and streamed files 404 if the remote is deleted or the upstream is unreachable, because Pulp never stored the bytes. Switch to `immediate` and sync again for a copy that stands alone. [Export](./disconnected.md) also refuses on-demand content: the artifacts have to exist.
:::

## Which ecosystems use which

| Family                                                | How content arrives                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Maven, npm, Python, RubyGems, Container, Hugging Face | Pull-through cache. Python, RubyGems and Container can also sync a named set ahead of time. Hugging Face is pull-through only. |
| RPM, Debian, File, OSTree                             | Sync. On demand is the usual policy: metadata now, each package or file on first request. There is no pull-through.            |
| Ansible collections                                   | Sync, and only `immediate`. The remote's requirements list is the set. An empty list tries to mirror the whole server.         |

npm and container pull-through are tech previews in their plugins.

A Maven, npm or Python pull-through remote belongs on the **distribution**. Leaving it only on the repository does not make the cache answer client requests. A RubyGems pull-through distribution needs no repository: cached gems are stored as content and are not added to one. A container pull-through distribution creates a repository per image as clients pull.
