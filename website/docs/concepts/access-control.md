---
title: Access control
sidebar_position: 6
---

# Access control (RBAC)

Pulp uses role-based access control, the same idea as Artifactory permission targets or GitHub team
permissions: you grant **roles** to **users** and **groups**, and a role is a bundle of permissions.

## The pieces

- **Users** and **Groups** — identities, and collections of users. Both are global, not per-domain.
- **Role** — a named set of permissions, assignable at three scopes:

  | Scope      | Means                                                  | Example                          |
  | ---------- | ------------------------------------------------------ | -------------------------------- |
  | **global** | Applies to every object of a type.                     | "Create any RPM repository."     |
  | **object** | Applies to one object (granted on its **Access** tab). | "Owner of _this_ repository."    |
  | **domain** | Applies within one [domain](./domains.md).             | "Manage everything in `team-a`." |

- **Access policy** — the low-level rules a Pulp API endpoint enforces. Advanced; most of the time
  you work with roles, not policies.

Creating an object automatically grants you its **owner** role — so the person who makes a repository
can manage it without an admin stepping in.

## How it shows up in Pulp UI

- The UI doesn't hide admin pages by role. Instead, RBAC filters what the API returns: lists come
  back with only the objects you're allowed to see.
- Actions you can't perform are **disabled with a tooltip**, not hidden — so you can tell the feature
  exists and that you'd need permission.
- A **superuser** sees and can do everything.

## Where to manage it

[Users](../administration/users.md) · [Groups](../administration/groups.md) ·
[Roles & permissions](../administration/roles-and-permissions.md) ·
[Granting access to objects](../administration/object-access.md) ·
[Access policies](../administration/access-policies.md)
