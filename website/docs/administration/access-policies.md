---
title: Access policies
sidebar_position: 5
---

# Access policies

An access policy is the set of rules a Pulp viewset enforces to decide who may call each action,
and which roles are auto-granted when an object is created. View them under
**Administration → Access Policies**.

This is advanced — most access control is done with [roles](./roles-and-permissions.md) and the
per-object [Access tab](./object-access.md). Reach for access policies only when you need to change
the default authorization rules themselves.

## Common tasks

- **Review** a viewset's statements.
- Understand which **creation hooks** grant the owner role on new objects.

:::note
Outline page — full walkthrough and screenshots to follow. See
[Access control](../concepts/access-control.md).
:::
