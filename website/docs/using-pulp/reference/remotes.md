---
title: Remotes
sidebar_position: 2
---

# Remotes

A remote is the upstream half of a proxy — like the "remote repository" config in Artifactory or a
proxy repo in Nexus. It describes **where** content comes from and **how** Pulp fetches it. A remote
does nothing on its own; a repository [syncs](../mirror-an-upstream.md) from it.

Manage remotes under **Content Management → Remotes**: list, create, edit, delete, and grant
per-object roles on the **Access** tab. Remotes are reusable — many repositories can sync from one.

## Fields that matter

The form is per content type, but the common fields are:

| Field           | What it does                                                                           |
| --------------- | -------------------------------------------------------------------------------------- |
| Name            | Identifier within the domain.                                                          |
| URL             | The upstream to fetch from (e.g. `https://pypi.org/`).                                 |
| Credentials     | Username/password, token or client certificate for private upstreams.                  |
| TLS / CA        | Verification and custom CA for HTTPS upstreams.                                        |
| Proxy           | Proxy URL and credentials, if Pulp reaches the internet through one.                   |
| Download policy | When bytes are fetched — see [Download policies](../../concepts/download-policies.md). |

## Remote types

Each plugin registers its own remote type(s), and some offer variants:

| Ecosystem | Remote types                                   |
| --------- | ---------------------------------------------- |
| RPM       | `rpm`, `uln` (Oracle ULN)                      |
| Python    | `python` (+ import from a Bandersnatch config) |
| Container | `container`, pull-through                      |
| File      | `file`, `git`                                  |
| Ansible   | collection, role, `git`                        |
| Others    | one remote type per plugin                     |

## See also

- [Mirror an upstream](../mirror-an-upstream.md) — the how-to.
- [Download policies](../../concepts/download-policies.md) — immediate, on-demand, streamed.
- The ecosystem [tutorials](../../tutorials/index.md) for the exact fields per type.
