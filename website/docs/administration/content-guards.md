---
title: Content guards
sidebar_position: 9
---

# Content guards

By default, content served at `/pulp/content/` is **anonymous**. A content guard attached to a
[Distribution](../using-pulp/serve-content.md) restricts who can download it.

Manage them under **System Management → Content Guards** (create/edit/delete, and **Manage access**
for RBAC on the guard itself).

## Guard types

| Type              | Protects by                              |
| ----------------- | ---------------------------------------- |
| RBAC              | Pulp users/roles.                        |
| X.509 certificate | Client TLS certificate (pulp-certguard). |
| RHSM certificate  | Red Hat subscription certificate.        |
| Header            | A required HTTP header value.            |
| Composite         | Combining several guards (OR logic).     |
| Redirect          | Internal use (container registry).       |

A domain can set a **default content guard** applied to new distributions.

:::note
Outline page — full walkthrough and screenshots to follow.
:::
