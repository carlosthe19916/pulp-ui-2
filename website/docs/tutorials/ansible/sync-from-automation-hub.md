---
title: Sync from Red Hat Automation Hub
sidebar_label: Sync from Automation Hub
sidebar_position: 1
---

# Sync from Red Hat Automation Hub

**Goal:** mirror certified collections from a token-protected Galaxy v3 server (Red Hat Automation Hub, or any private hub) into a Pulp repository — like an Artifactory remote repository proxying a registry you authenticate to.

The [main tutorial](../ansible.mdx) mirrors public `galaxy.ansible.com`. This guide adds the token and requirements an authenticated hub needs.

## 1. Create a collection remote with a token

**Content Management → Remotes → Create remote.** Type **Ansible collection**, then set:

| Field                       | Value                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------- |
| **URL**                     | Your hub's API, e.g. `https://console.redhat.com/api/automation-hub/content/published/` |
| **Token**                   | The offline token / API token from your hub account                                     |
| **SSO URL** (`auth_url`)    | The token refresh endpoint, e.g. the Red Hat SSO token URL                              |
| **Requirements**            | YAML listing what to mirror (see below)                                                 |
| **Sync dependencies**       | On — pull each collection's dependencies too                                            |
| **Sync highest versions**   | On to mirror only the latest of each collection; off to mirror all versions             |
| **Signed collections only** | On to mirror only signed versions                                                       |

```yaml title="Requirements"
collections:
  - name: redhat.rhel_system_roles
  - name: ansible.posix
    version: ">=2.0.0"
```

:::note
Collection remotes sync with the **immediate** policy — there is no on-demand download for Ansible (see the gap note on the [main tutorial](../ansible.mdx)). Always list your collections in **Requirements**; an empty list against a full hub tries to mirror everything.
:::

## 2. Sync a repository from it

1. **Repositories → Create repository.** Type **Ansible**, set its **Remote** to the one above.
2. On the repository, **Actions → Sync**. Follow the [task](../../using-pulp/monitor-tasks.md); each sync that changes content makes a new [version](../../using-pulp/versions-and-rollback.md).
3. **Distributions → Create distribution** pointed at the repository to serve it, then configure `ansible-galaxy` as in the [main tutorial](../ansible.mdx).

## Related

- [Ansible Galaxy server](../ansible.mdx) — the full proxy → host → consume flow
- [Mirror roles and Git collections](./mirror-roles-and-git.md)
- [Mirror an upstream](../../using-pulp/mirror-an-upstream.md) · [Download policies](../../concepts/download-policies.md)
- Depth: [pulp_ansible collection sync](https://pulpproject.org/pulp_ansible/docs/user/guides/collections/)
