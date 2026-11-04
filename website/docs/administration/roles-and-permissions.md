---
title: Roles & permissions
sidebar_label: Roles & permissions
sidebar_position: 4
---

# Roles & permissions

A **role** is a named set of permissions you can assign to a user or group — globally, on a single object, or within a domain. Manage roles under **Administration → Roles**, where the role form has a permission picker. Pulp ships built-in roles per plugin (for example `rpm.rpmrepository_owner`); the creator of an object automatically gets its owner role.

To grant a role on a specific repository, remote or distribution, use that object's **Access** tab — see [Granting access to objects](./object-access.md). For the people roles are assigned to, see [Users](./users.md) and [Groups](./groups.md). For the concepts behind RBAC, see [Access control](../concepts/access-control.md).

:::note
This page is a work in progress. Contributions are welcome on [GitHub](https://github.com/carlosthe19916/pulp-ui-2/tree/main/website/docs/administration/roles-and-permissions.md).
:::
