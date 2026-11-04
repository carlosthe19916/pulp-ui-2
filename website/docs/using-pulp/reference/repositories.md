---
title: Repositories
sidebar_position: 3
---

# Repositories

A repository is a bucket for content of **one** plugin's type — like a hosted repo in Artifactory or
Nexus, except an RPM repo can only hold RPMs, a Python repo only Python packages, and so on. It's
the hub of the UI: you sync, upload, version, publish and serve from here.

Every change (sync, upload, removal) creates a new **immutable** [repository version](../versions-and-rollback.md).

Manage repositories under **Content Management → Repositories**: create, edit, delete, and open one
for its detail page.

## Actions

From a repository's detail page:

| Action              | What it does                                                        |
| ------------------- | ------------------------------------------------------------------- |
| Sync                | Pull content from a [remote](./remotes.md), creating a new version. |
| Add content…        | Upload, or copy references from another repository.                 |
| Remove all content… | Empty the repository (as a new version).                            |
| Publish             | Generate a [publication](./publications.md) (rpm/deb/gem).          |
| Edit / Delete       | Change settings or remove the repository.                           |

Some plugins add their own actions — for example RPM copy/comps/prune/scan, Container
tag/untag/sign/build-image, Ansible sign/mark/copy, Maven repair.

## Tabs

**Details** · **Content** · **Versions** · **Publications** · **Distributions** ·
**Topology** (a relationship graph) · **Access** (per-object roles).

## Useful settings

- **Retain versions** (`retain_repo_versions`) — auto-prune old versions; versions a distribution is
  serving are protected.

## See also

[Mirror an upstream](../mirror-an-upstream.md) ·
[Host your packages](../host-your-packages.md) ·
[Versions and rollback](../versions-and-rollback.md) ·
[Core entities](../../concepts/entities.md)
