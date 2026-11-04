---
title: Granting access to objects
sidebar_label: Object access
sidebar_position: 6
---

# Granting access to objects

Besides global roles, you can grant a [role](./roles-and-permissions.md) on a **single object** — for
example making someone the owner of one repository without touching anything else. This is Pulp's
equivalent of per-repository permissions in Artifactory/Nexus.

## Grant a role on one object

1. Open the repository, remote, distribution or publication.
2. Go to its **Access** tab.
3. Add a [user](./users.md) or [group](./groups.md) and pick the role to grant (for example
   `..._owner` or `..._viewer`). Remove a grant from the same tab.

For objects without their own page (such as [content guards](./content-guards.md)), use the
**Manage access** action on the object's row — it does the same thing.

## Typical use: a CI account

Create a dedicated CI [user](./users.md), then grant it only an owner (or publish-only) role on the
one repository it deploys to — instead of reusing an administrator. The ecosystem
[tutorials](../tutorials/index.md) reference this pattern.

## Good to know

- The creator of an object automatically gets its owner role.
- This is the **object** scope from [Access control](../concepts/access-control.md); global and
  per-domain grants are done on [Roles](./roles-and-permissions.md).
