---
title: Access policies
sidebar_position: 5
---

# Access policies

An access policy is the rule set a Pulp API endpoint enforces to decide **who may call each action**,
plus which roles are auto-granted when an object is created. Think of it as the authorization engine
underneath [roles](./roles-and-permissions.md). View them under **Administration → Access Policies**.

This is advanced. Day-to-day access control is done with [roles](./roles-and-permissions.md) and the
per-object [Access tab](./object-access.md) — reach for access policies only to understand or change
the default authorization rules themselves.

## What you can do here

1. Open an endpoint's policy to **review its statements** — the conditions that allow or deny each
   action.
2. See which **creation hooks** grant the owner role when a new object is created.

Changing policies can lock users out of actions; prefer roles unless you know you need a policy
change. See [Access control](../concepts/access-control.md).
