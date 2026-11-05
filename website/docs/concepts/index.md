---
title: If you know Artifactory
description: How Maven, npm, Python and RubyGems map onto Pulp, and the behavior that differs from a group repository.
sidebar_label: If you know Artifactory
sidebar_position: 1
---

# If you know Artifactory

This page is for Maven, npm, Python and RubyGems. RPM, Debian, containers, Ansible, files, Hugging Face and OSTree are different jobs. Start at the [tutorial for that ecosystem](../tutorials/index.md).

Pulp proxies a public registry, hosts your packages, and serves them at a URL. It splits that into separate objects, and a few of its rules change what a client sees.

| Artifactory / Nexus        | Pulp                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| Hosted repository          | A repository of one content type, plus a distribution that serves it.                              |
| Proxy / remote repository  | A remote (the upstream) attached to a distribution for pull-through, or synced into a repository.  |
| The URL clients pull from  | The distribution's base path. Creating a repository does not publish it.                           |
| Group / virtual repository | Python only: one index can serve a repository and fall back to a pull-through remote.              |
| Repository snapshot        | A repository version. It is immutable, and a new one is created only when the content set changes. |

Maven, npm and RubyGems list each repository in the client (`settings.xml`, `.npmrc`, `Gemfile`). They do not combine a hosted repository and a cache into one URL.

## What changes the outcome

- **Content is global.** A package exists once and repositories reference it. Deleting a repository leaves the bytes until [orphan cleanup](./disk.md).
- **Every change is a new version.** A sync or upload that changes the set appends a version. A no-op sync does not. Point a distribution at a version to freeze what clients see. See [What clients see](./what-clients-see.md).
- **Writes are tasks.** A sync or publish returns immediately and finishes in the background. The task drawer and the resource's status show progress. A failed task carries the error.
- **When the bytes arrive** depends on the remote. See [When bytes are fetched](./download-policies.md).

## Where to go

- [Maven](../tutorials/maven.mdx), [npm](../tutorials/npm.mdx), [Python](../tutorials/python.mdx), [RubyGems](../tutorials/gem.mdx)
- [Who can push](./access-control.md) for a CI user that can publish and cannot administer the server
