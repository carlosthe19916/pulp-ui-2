---
title: Users
sidebar_position: 2
---

# Users

A user is a sign-in account — like a user in Artifactory or Nexus security. Manage them under
**Administration → Users**.

## Create a user

1. Go to **Administration → Users** and click **Create**.
2. Fill in **username** and **password**, and optionally name and email.
3. Set the **superuser** flag only for full administrators — a superuser bypasses all
   [RBAC](../concepts/access-control.md) checks.
4. Save.

## Other tasks

- **Edit or delete** a user from its row or detail page.
- **Add a user to groups** — open the user and use the **Groups** tab. Group membership is the usual
  way to grant access, rather than assigning roles to each person.

## Good to know

- Users are **global** — they are not scoped to a [domain](./domains.md).
- A user with no roles can sign in but sees empty lists. Grant access through
  [groups](./groups.md) and [roles](./roles-and-permissions.md), or on a single object via
  [object access](./object-access.md).
- With OIDC authentication, accounts come from your identity provider; see
  [Authentication](../running-pulp-ui/authentication.md).
