---
title: The content workflow
sidebar_position: 3
---

# The content workflow

There are two ways content gets **into** Pulp — syncing from upstream, and adding your own — and one
way it gets **out**: a distribution.

## Mirror from upstream

```
Remote ──sync──▶ Repository ──▶ Repository version ──▶ [Publication] ──▶ Distribution ──▶ client
```

1. Create a **Remote** describing the upstream (URL, credentials, [download policy](./download-policies.md)).
2. Create a **Repository** and **sync** it from the Remote. Each sync that changes content creates a
   new immutable **repository version**.
3. For ecosystems that need it, create a **Publication** from the version.
4. Create a **Distribution** to serve it at a URL.

Walk it in the UI: [Mirror an upstream](../using-pulp/mirror-an-upstream.md).

## Add your own

```
upload / push ──▶ Content ──▶ Repository version ──▶ [Publication] ──▶ Distribution ──▶ client
```

Most ecosystems: **upload** a package in Pulp UI. Containers are different — you `podman push`
straight to Pulp, like pushing to any registry. OSTree uses **import**. Either way the content lands
in a repository (new version) and is served the same way.

Walk it in the UI: [Host your packages](../using-pulp/host-your-packages.md).

## Where publications apply

A Publication is only needed where the client reads a generated index.

| Needs a publication | Serves straight from the repository version                  |
| ------------------- | ------------------------------------------------------------ |
| RPM, Debian, Gem    | Python, Ansible, Container, OSTree, npm, Maven, Hugging Face |

## Get it out

A [Distribution](./entities.md) is the only thing clients talk to. Point it at the repository to
always serve the latest version, or pin it to a version/publication to freeze what clients see. Then
[consume](../using-pulp/consume-content.md) it with the native tool (`pip`, `dnf`, `podman`, …).
