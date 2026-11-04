---
title: Concepts
description: Pulp's core concepts for Artifactory and Nexus users — how repositories, remotes, distributions, publications and repository versions map to the tools you already know.
sidebar_label: Pulp for Artifactory users
sidebar_position: 1
---

# Pulp for Artifactory / Nexus users

If you've used Artifactory or Nexus, you already know most of this. Pulp is a repository manager:
it proxies public registries, hosts your own packages, and serves them at URLs your tools pull
from. It just uses different names, and splits a few things apart that other tools keep together.

## The mental model

| Artifactory / Nexus        | Pulp                         | Notes                                                     |
| -------------------------- | ---------------------------- | --------------------------------------------------------- |
| Hosted repository          | Repository                   | Holds your own uploaded content of one type.              |
| Proxy / remote repository  | Remote **+** Repository      | A Remote is the upstream config; you sync it into a Repo. |
| The URL clients pull from  | Distribution (`base_path`)   | A Repo isn't served until a Distribution exposes it.      |
| Generated index / metadata | Publication                  | Only some ecosystems need one (see below).                |
| Group / virtual repository | A Distribution over versions | Pulp composes via copy/promote rather than a live group.  |
| Repository snapshot        | Repository version           | **Immutable**; created automatically on every change.     |

## What's different from Artifactory

- **Content is global and immutable.** A package exists once; repositories reference it. Deleting a
  repo doesn't delete the bytes.
- **Every change makes a new version.** Syncs and uploads produce a new immutable repository
  version, so rollback is free. See [Versions](./entities.md).
- **Serving is a separate step.** Creating a repository doesn't publish it; a
  [Distribution](./entities.md) does.
- **Writes are asynchronous.** A sync or publish returns a task you follow. See [Tasks](./tasks.md).

## Read next

- [Core entities](./entities.md) — repositories, remotes, distributions, publications, content.
- [The content workflow](./content-workflow.md) — how they connect, end to end.
- [Download policies](./download-policies.md) — immediate, on-demand, and pull-through caching.
- [Domains](./domains.md) · [Access control](./access-control.md) · [Tasks](./tasks.md) ·
  [Glossary](./glossary.md)
