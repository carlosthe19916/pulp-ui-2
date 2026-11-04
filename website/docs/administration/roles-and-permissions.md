---
title: Roles & permissions
sidebar_label: Roles & permissions
sidebar_position: 4
---

# Roles & permissions

A **role** is a named set of permissions — like a permission target or privilege set in
Artifactory/Nexus. You assign a role to a [user](./users.md) or [group](./groups.md) at one of three
scopes:

| Scope      | Means                                     | Example                                      |
| ---------- | ----------------------------------------- | -------------------------------------------- |
| **Global** | The permission applies everywhere.        | "Can create any RPM repository."             |
| **Object** | The permission applies to one object.     | "Owner of _this_ repository."                |
| **Domain** | The permission applies within one domain. | "Manage everything in the `staging` domain." |

## Built-in roles

Pulp ships roles per plugin, named `<app>.<model>_<level>` — for example
`rpm.rpmrepository_owner`, `rpm.rpmrepository_viewer`, `core.task_owner`. When you create an object,
you automatically get its **owner** role. Built-in roles cover most needs.

## Create a custom role

1. Go to **Administration → Roles** and click **Create**.
2. Name the role and use the **permission picker** to select its permissions.
3. Save, then assign it — globally/per-domain to [users](./users.md) or [groups](./groups.md), or on
   a single object via its [Access tab](./object-access.md).

## See also

[Granting access to objects](./object-access.md) · [Access policies](./access-policies.md) ·
[Access control concepts](../concepts/access-control.md)
