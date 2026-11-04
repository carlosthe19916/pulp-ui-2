---
title: The content workflow
sidebar_position: 3
---

# The content workflow

There are two ways content gets into Pulp — syncing from upstream, and uploading your own — and
one way it gets out: a distribution.

## Mirror from upstream

```
Remote ──sync──▶ Repository ──▶ Repository version ──▶ [Publication] ──▶ Distribution ──▶ client
```

1. Create a **Remote** describing the upstream (URL, credentials, [download policy](./download-policies.md)).
2. Create a **Repository** and **sync** it from the Remote. Each sync that changes content creates a
   new immutable **repository version**.
3. For ecosystems that need it, create a **Publication** from the version.
4. Create a **Distribution** to serve it at a URL.

## Host your own

```
upload ──▶ Content ──▶ Repository version ──▶ [Publication] ──▶ Distribution ──▶ client
```

Upload a package in Pulp UI (or push, for container images). It becomes **Content**, is added to a
repository (creating a new version), and is served the same way.

## Where publications apply

| Needs a publication | Serves from the repository version                           |
| ------------------- | ------------------------------------------------------------ |
| RPM, Debian, Gem    | Python, Ansible, Container, OSTree, npm, Maven, Hugging Face |

## Walk it in the UI

[Mirror an upstream](../using-pulp/mirror-an-upstream.md) ·
[Host your packages](../using-pulp/host-your-packages.md) ·
[Serve content](../using-pulp/serve-content.md) ·
[Consume content](../using-pulp/consume-content.md)
