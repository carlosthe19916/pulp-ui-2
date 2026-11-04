---
title: Glossary
sidebar_position: 8
---

# Glossary

Quick Pulp term ⇄ repository-manager term reference. See [Core entities](./entities.md) for the
longer explanation of each.

| Pulp term                | Means                                                              | Like (Artifactory / Nexus / …) |
| ------------------------ | ------------------------------------------------------------------ | ------------------------------ |
| Artifact                 | A stored file, deduplicated by checksum.                           | The binary on disk.            |
| Content unit             | A logical package/image/collection (has 0..n artifacts).           | A package / artifact.          |
| Repository               | A bucket of one plugin's content type.                             | Hosted repository.             |
| Repository version       | An immutable snapshot of a repo's content.                         | A repository snapshot.         |
| Remote                   | Upstream source config (URL, creds, policy).                       | The "remote" half of a proxy.  |
| Sync                     | Pulling content from a Remote into a Repository.                   | Proxy fetch / reindex.         |
| Download policy          | When bytes are fetched: immediate / on-demand / streamed.          | Proxy cache mode.              |
| Pull-through cache       | A Distribution that caches from upstream on first request.         | Remote / proxy repository.     |
| Publication              | Generated metadata for a version (RPM / Deb / Gem).                | Generated repo index.          |
| Distribution             | The served URL (`base_path`) for a repo/version/publication.       | The URL clients hit.           |
| Base path                | The path segment a Distribution is served under.                   | Repository key / path.         |
| Content app              | The server that streams content via distributions.                 | The download endpoint.         |
| Domain                   | An isolated tenant with its own storage.                           | A separate instance / space.   |
| Task                     | A background job (sync, publish, delete…).                         | An async operation / CI job.   |
| Content guard            | An access rule attached to a distribution.                         | Repository permission / token. |
| Role                     | A named permission set, assignable globally/per-object/per-domain. | Permission target / team role. |
| Signing service          | A configured key + script Pulp uses to sign content/metadata.      | GPG signing config.            |
| Alternate content source | A closer/faster mirror Pulp prefers for downloads.                 | CDN / mirror.                  |
| Orphan                   | Content no longer in any repository version.                       | Unreferenced blob (GC target). |
