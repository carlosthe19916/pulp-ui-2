---
title: What clients see
description: A distribution follows the latest version or a frozen one, content URLs are anonymous until a guard, and only some ecosystems need a publication.
sidebar_label: What clients see
sidebar_position: 3
---

# What clients see

A distribution is the URL clients pull from. The repository behind it is not reachable until that distribution exists.

## Latest or frozen

| The distribution points at | Clients receive                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| A repository               | The latest version, so the next sync or upload changes what they install.                               |
| A repository version       | That snapshot, until you point the distribution somewhere else.                                         |
| A publication              | The index generated from one version. Serving an older publication rolls the client-visible index back. |

Versions a distribution is still serving are kept when old versions are pruned.

## Promote and roll back

The console has no promote button. Promotion is two repositories and a pointer:

1. Sync or upload into a staging repository. Clients do not see it.
2. Copy the packages you approve into the release repository. A copy adds references, not bytes, and creates a new release version.
3. To roll back, point the release distribution at the previous version (or, for RPM, Debian, RubyGems and File, the previous publication). Point it back at the repository to follow the latest version again.

## Changes that break clients without a warning

| Change                                                     | What clients get                                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Rename a distribution's base path                          | `404` at the old URL. Nothing redirects.                                                          |
| Delete the remote behind on-demand or pull-through content | `404` for every file Pulp never downloaded. See [When bytes are fetched](./download-policies.md). |
| Turn off auto-publish (RPM, Debian)                        | The old index. New versions get no publication until you publish.                                 |
| Add a content guard to a distribution in use               | `401`/`403` until each client sends credentials.                                                  |
| Redeploy a Maven release, or re-upload a File path         | The new bytes, in a new version. Pulp does not refuse the overwrite.                              |

## Who can download

`/pulp/content/` is anonymous: anyone with the URL can pull. Attach a [content guard](./operating.md#content-guards) to the distribution to require a Pulp user, a client certificate, or a header.

Container distributions are the exception. **Private** on the distribution hides images from anonymous pulls. Pushing still requires a user allowed to create repositories in that namespace.

## When you need a publication

A publication is the index a client reads, generated from a repository version.

| Needs a publication                                                                                       | Serves without one                                                                    |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| RPM (`repomd.xml`), Debian (`Release` / `Packages`), RubyGems (the compact index), File (`PULP_MANIFEST`) | Python, Maven, npm, Container, Ansible, OSTree, and a Hugging Face pull-through cache |

RPM and Debian repositories can auto-publish, so each new version gets an index. A File or RubyGems repository that is not published answers the client with a missing index. Debian has two publication types: structured rebuilds the index from the content you curate, and verbatim republishes the upstream files unchanged. See [APT](../tutorials/deb.mdx).
