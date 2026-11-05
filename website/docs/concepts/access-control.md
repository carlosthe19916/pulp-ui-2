---
title: Who can push
description: Role scopes, the owner role you get on create, a CI user that can publish, and how OIDC accounts appear.
sidebar_label: Who can push
sidebar_position: 4
---

# Who can push

Downloads are anonymous until a distribution has a guard (see [What clients see](./what-clients-see.md)). Publishing, uploading and syncing need a role.

A role is a named set of permissions. You assign it to a user or a group at one of three scopes:

| Scope  | Applies to                                          | Example                         |
| ------ | --------------------------------------------------- | ------------------------------- |
| Global | Every object of that type.                          | Create any RPM repository.      |
| Domain | Everything in one [domain](./operating.md#domains). | Manage everything in `staging`. |
| Object | One repository, remote, distribution or guard.      | Owner of this repository.       |

Built-in roles ship with each plugin and are named `<plugin>.<model>_<level>`, for example `rpm.rpmrepository_owner`. Creating an object gives you its **owner** role. A custom role is a set of permissions you pick and name.

## What surprises people

- **A user with no roles** can sign in, but every list is empty. The console shows the same navigation to everyone and disables actions you cannot perform.
- **A superuser** bypasses every check. Turn it on only for administrators.
- **Users and groups are global**, not per domain. Grant roles to a group so access follows the team. Deleting a group keeps the roles a member was granted directly or through another group.
- **Object grants** are on the object's **Access** tab. Objects without their own page, such as content guards, use **Manage access** on the list row.
- **Hugging Face** has no object roles. Grant its global roles instead.
- **Access policies** are the per-endpoint rules underneath roles, including the hook that grants owner on create. Editing one can lock users out of an action. Change roles instead, unless you mean to change the default rules.

## A CI account

Create a user for the pipeline. Grant it owner, or a narrower custom role, on the one repository it publishes to. Do not reuse an administrator account.

With [OIDC](../running-pulp-ui/authentication.md), the identity provider creates the account on first sign-in. Pulp UI cannot create it, so grant roles once the account exists.
