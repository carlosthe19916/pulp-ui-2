---
title: Granting access to objects
sidebar_label: Object access
sidebar_position: 6
---

# Granting access to objects

Besides global roles, you can grant a [role](./roles-and-permissions.md) on a **single object** —
for example making a user the owner of one repository without giving them access to any other.

## How

- Repositories, Remotes, Distributions and Publications have an **Access** tab. Open it to grant or
  revoke a user's or group's role on that object.
- Objects without their own page (for example [content guards](./content-guards.md)) offer a
  **Manage access** row action that does the same.

This is the per-object scope described in [Access control](../concepts/access-control.md). The
creator of an object automatically gets its owner role.

## Typical use

Create a CI user, then grant it only the `..._owner` (or a publish-only) role on the one repository
it needs — instead of reusing an administrator. The ecosystem [tutorials](../tutorials/index.md)
reference this pattern.

:::note
Outline page — full walkthrough and screenshots to follow.
:::
