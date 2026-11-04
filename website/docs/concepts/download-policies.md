---
title: Download policies
sidebar_position: 4
---

# Download policies & pull-through caching

A Remote's **download policy** decides when Pulp fetches the actual package bytes during a sync.

| Policy      | When bytes are fetched                                  | Use it for                                  |
| ----------- | ------------------------------------------------------- | ------------------------------------------- |
| `immediate` | All at sync time (default).                             | Content you must have offline / air-gapped. |
| `on_demand` | Metadata now; each package on first request, then kept. | Large upstreams (PyPI, a full RPM mirror).  |
| `streamed`  | On request, and **not** stored.                         | Throwaway / nightly content.                |

:::warning
With `on_demand` or `streamed`, deleting the Remote (or losing upstream access) breaks serving —
clients get 404s for bytes Pulp never stored.
:::

## Pull-through caching

Some ecosystems support **pull-through caching**: instead of pre-syncing, you attach a Remote to a
**Distribution**, and Pulp fetches + caches any package the first time a client asks for it — like
an Artifactory remote repository. Supported (some as tech preview) by **Python, Gem, npm,
Container, Maven and Hugging Face**. Hugging Face is cache-first by design.

See each ecosystem's [tutorial](../tutorials/index.md) for whether it uses sync or pull-through.
