---
title: Mirror roles and Git collections
sidebar_label: Mirror roles and Git
sidebar_position: 2
---

# Mirror roles and Git collections

**Goal:** mirror content that isn't a published collection — legacy Galaxy **roles**, or collections straight from a **Git** repository.

Besides the standard **Ansible collection** remote (see [Sync from Automation Hub](./sync-from-automation-hub.md)), Pulp UI offers two more remote types. Pick by where the content lives:

| Remote type        | Mirrors                                            | Use when                                              |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------- |
| Ansible collection | Published collections from a Galaxy v3 server      | The normal case (modern format).                      |
| **Ansible role**   | Legacy standalone roles from a Galaxy v1 roles URL | You still depend on pre-collection roles.             |
| **Ansible (Git)**  | A collection built from a Git repo                 | The collection isn't published anywhere, only in Git. |

Roles are the legacy format; collections are the modern one. Reach for Git when a team publishes only to source control.

## Mirror roles

1. **Content Management → Remotes → Create remote.** Type **Ansible role**, set the Galaxy v1 roles **URL** (optionally narrow by namespace).
2. Create an **Ansible** repository with that remote and **Sync** it.
3. Serve it with a distribution; `ansible-galaxy role install -s <url>` then installs from Pulp.

## Mirror a collection from Git

1. **Create remote.** Type **Ansible (Git)**, set the repository **URL** and a **Git ref** (branch, tag, or commit).
2. Turn on **Metadata only** to index without downloading full artifacts, if you only need the metadata.
3. Create an **Ansible** repository with that remote and **Sync**. Pulp builds the collection from the ref.

## Related

- [Ansible Galaxy server](../ansible.mdx) · [Sync from Automation Hub](./sync-from-automation-hub.md)
- [Core entities](../../concepts/entities.md) — remotes and repositories
- Depth: [pulp_ansible roles](https://pulpproject.org/pulp_ansible/docs/user/guides/roles/) · [Git remotes](https://pulpproject.org/pulp_ansible/docs/user/guides/collections/)
