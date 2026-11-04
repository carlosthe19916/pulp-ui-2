---
title: Mirror an upstream
sidebar_position: 2
---

# Mirror an upstream

**Goal:** proxy a public registry (PyPI, Docker Hub, a Fedora mirror, …) so your tools pull through
Pulp instead of hitting the internet — Pulp's version of an Artifactory **remote** (proxy)
repository.

## Steps

1. **Create a Remote** — **Content Management → Remotes → Create**. The form adapts to the content
   type you pick. The fields that matter:
   - **Name** and **URL** — the upstream (for example `https://pypi.org` or a Fedora mirror).
   - **Credentials / TLS** — only if the upstream is private.
   - **Download policy** — how much to fetch at sync time. `On demand` is the usual default; see
     [Download policies](../concepts/download-policies.md).
2. **Create a Repository** of the same content type — **Content Management → Repositories → Create**
   — and set its **Remote** to the one above (or pick it when you sync).
3. **Sync** — open the repository and choose **Sync**. It runs as a
   [task](./monitor-tasks.md); every sync that changes content produces a new immutable
   [version](./versions-and-rollback.md). Re-sync anytime to pull upstream updates.
4. **Serve it** so clients can reach it — [Serve content](./serve-content.md).

## Cache vs mirror vs pull-through

| Approach               | What Pulp stores                                  | Like (Artifactory)        |
| ---------------------- | ------------------------------------------------- | ------------------------- |
| **On-demand sync**     | Metadata now, each package on first request.      | Remote repo, lazy cache.  |
| **Complete mirror**    | A bit-for-bit copy, including upstream removals.  | Fully replicated remote.  |
| **Pull-through cache** | Nothing up front; caches on first client request. | Remote repo, no pre-sync. |

With pull-through you skip the sync and the repository entirely: attach the Remote to a
**Distribution** and Pulp fetches on demand. Supported by Python, Gem, npm, Container, Maven and
Hugging Face — see [Download policies](../concepts/download-policies.md).

## Per-ecosystem

Each [tutorial](../tutorials/index.md) lists the exact Remote URL, filters and policy for its
ecosystem. Full field reference: [Remotes](./reference/remotes.md).
