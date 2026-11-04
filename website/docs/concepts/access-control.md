---
title: Access control
sidebar_position: 6
---

# Access control (RBAC)

Pulp uses role-based access control. The concepts:

- **Users** and **Groups** — identities, and collections of users. Both are global (not per-domain).
- **Role** — a named set of permissions. Assignable at three scopes:
  - **global** (model level) — e.g. "can create any RPM repository",
  - **object** — e.g. "owner of _this_ repository" (granted on the object's **Access** tab),
  - **domain** — the role applies within one domain.
- **Access policy** — the rules a viewset enforces to decide who may call which action. Advanced;
  most users rely on roles.

Creating an object automatically grants you its **owner** role.

## How it shows up in Pulp UI

- The UI doesn't hide admin pages by role. Instead, RBAC filters what the API returns: lists come
  back with only the objects you can see, and actions you lack permission for are **disabled with a
  tooltip**, not hidden.
- A superuser sees and can do everything.

## Where to manage it

[Users](../administration/users.md) · [Groups](../administration/groups.md) ·
[Roles & permissions](../administration/roles-and-permissions.md) ·
[Granting access to objects](../administration/object-access.md) ·
[Access policies](../administration/access-policies.md)
