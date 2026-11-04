---
title: Glossary
sidebar_position: 8
---

# Glossary

Quick Pulp term ⇄ repository-manager term reference.

| Pulp term          | Means                                                              | Like (Artifactory/Nexus)      |
| ------------------ | ------------------------------------------------------------------ | ----------------------------- |
| Artifact           | A stored file, deduplicated by checksum.                           | The binary on disk.           |
| Content unit       | A logical package/image/collection (has 0..n artifacts).           | A package/artifact.           |
| Repository         | A bucket of one plugin's content type.                             | Hosted repository.            |
| Repository version | An immutable snapshot of a repo's content.                         | A repository snapshot.        |
| Remote             | Upstream source config (URL, creds, policy).                       | The "remote" half of a proxy. |
| Sync               | Pulling content from a Remote into a Repository.                   | Proxy fetch / reindex.        |
| Publication        | Generated metadata for a version (RPM/Deb/Gem).                    | Generated repo index.         |
| Distribution       | The served URL (`base_path`) for a repo/version/publication.       | The URL clients hit.          |
| Content app        | The server that streams content via distributions.                 | The download endpoint.        |
| Domain             | An isolated tenant with its own storage.                           | A separate instance/space.    |
| Task               | A background job (sync, publish, delete…).                         | An async operation.           |
| Content guard      | An access rule attached to a distribution.                         | Repository permission/token.  |
| Role               | A named permission set, assignable globally/per-object/per-domain. | Permission target / role.     |

See [Core entities](./entities.md) for the longer explanation of each.
