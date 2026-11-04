---
title: Download policies
sidebar_position: 4
---

# Download policies & pull-through caching

A Remote's **download policy** decides when Pulp fetches the actual package bytes during a sync.
It's the trade-off between disk usage and self-sufficiency.

| Policy      | When bytes are fetched                                  | Use it for                                  |
| ----------- | ------------------------------------------------------- | ------------------------------------------- |
| `immediate` | All at sync time (default).                             | Content you must have offline / air-gapped. |
| `on_demand` | Metadata now; each package on first request, then kept. | Large upstreams (PyPI, a full RPM mirror).  |
| `streamed`  | On request, and **not** stored.                         | Throwaway / nightly content.                |

With `on_demand`, the first client to request a package pays the upstream round-trip; everyone after
gets it from Pulp. It's the usual choice for big registries you don't want to copy in full.

:::warning
With `on_demand` or `streamed`, deleting the Remote (or losing upstream access) breaks serving —
clients get 404s for bytes Pulp never stored. Switch to `immediate` and re-sync if you need a
self-contained copy.
:::

## Pull-through caching

Pull-through caching skips the sync entirely. You attach a Remote to a **Distribution**, and Pulp
fetches and caches any package the first time a client asks for it — exactly like an **Artifactory
remote repository** or Docker Hub's registry mirror. No `includes`/`excludes` list to maintain: the
cache fills itself from real usage.

Supported by **Python, Gem, npm, Container, Maven and Hugging Face** (several still tech preview).
Hugging Face is cache-first by design. See each ecosystem's [tutorial](../tutorials/index.md) for
whether it uses a synced mirror or pull-through.
