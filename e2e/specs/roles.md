---
area: roles
routes: [/admin/roles]
---

# Roles

Roles have no detail page. Assigning roles to users and groups is covered on those detail pages
(users.md Roles tab, groups.md Roles tab).

## List

### ROL-LIST-01 Row content

Summary: The Roles list shows each role's name, plugin, description, permission count and locked state.

When I open Roles from the Administration navigation
Then the heading is "Roles", the Roles nav item is highlighted, and the column headers are Name,
Plugin, Description, Permissions, Locked, actions
And each row shows the role name as plain text (not a link), its Plugin, its Description (or "—",
long text truncated), its Permissions count, and a Locked label of Yes or No

### ROL-LIST-03 Locked filter combined with name filter and sort

Summary: The Locked filter narrows the Roles list and composes with the name filter and sort.

Seed: an unlocked role whose name shares a text with a built-in locked role (`e2e-match`); Pulp
can't create locked roles, so the locked one is built in

When I choose Locked <option>, type <name filter> and sort by <sort>
Then the listed rows are exactly <rows>, in the sort order

| option    | name filter | sort              | rows                      |
| --------- | ----------- | ----------------- | ------------------------- |
| All roles | (empty)     | Locked descending | every role, locked first  |
| Locked    | e2e-match   | Name ascending    | the seeded locked role    |
| Unlocked  | e2e-match   | Name ascending    | the seeded unlocked role  |
| Unlocked  | no-match    | Name ascending    | none — "No results found" |

### ROL-LIST-06 A non-superuser cannot read the Roles list

Summary: A non-superuser opening the Roles list sees “403: Access denied”.

Auth: second-user

Given a second user who is not a superuser
When they open the Roles list
Then the table shows "403: Access denied" (Pulp lets only superusers list roles)

## Locked roles

### ROL-LOCK-01 Locked roles cannot be edited or deleted

Summary: A locked role's Edit and Delete are disabled with tooltips; an unlocked role's are enabled.

When I open the row actions of a role with Locked <locked>
Then Edit is <edit> and Delete is <delete>, and clicking a disabled action opens nothing

| locked | edit                                              | delete                                             |
| ------ | ------------------------------------------------- | -------------------------------------------------- |
| Yes    | disabled, tooltip "Locked roles cannot be edited" | disabled, tooltip "Locked roles cannot be deleted" |
| No     | enabled                                           | enabled                                            |

Pulp itself refuses to change or delete a locked role ("The role is locked."), so the disabled
actions match the backend.

### ROL-LOCK-02 Locked roles can still be assigned

Summary: A locked role is still listed and selectable in Add Role, and assigning it succeeds.

When I open "Add Role" for a user or group
Then locked roles are listed and selectable, and adding one succeeds

## Create

### ROL-CRE-05 Create a role

Summary: Creating a role with a name and permissions shows a success toast and the role in the list, unlocked.

When I click "Create Role", enter a name and one or more permissions, and submit
Then the modal closes, the toast `Role "<name>" created` appears, and the role is in the Roles
list with Locked No and the permissions I added

### ROL-CRE-06 Create is not gated for a non-superuser

Summary: A non-superuser can open Create role, but submitting a valid form fails with a permission-denied error in the form.

Auth: second-user

Given a second user without permission to add roles
Then "Create Role" is enabled, and submitting a valid form shows the in-form error title "Failed
to create role" with the text "You do not have permission to perform this action. Ask an
administrator to grant the required role."

## Permission input

### ROL-PERM-01 A permission that saves with a server error

Summary: Adding a non-existent or wrong-case permission and saving fails with the server's exact “does not exist” error.

When I create a role and add a permission that does not exist (`core.not_a_permission`), and also
add `core.view_task` then `Core.view_task`, and save
Then the save fails with the server's reason — "Permission 'core.not_a_permission' does not
exist." or "Permission 'Core.view_task' does not exist." — Pulp matches codenames exactly, so
`Core.view_task` is a different, unknown permission

## Edit

### ROL-EDT-02 Changing description and permissions

Summary: Editing a role's description and adding/removing permissions saves the changes with a toast.

Given an unlocked role with a description and permissions `a.x`, `b.x`
When I change the description, add a permission and remove one, and save
Then the modal closes, the toast `Role "<name>" updated` appears, and the saved role matches

| description change   | add change  | remove change |
| -------------------- | ----------- | ------------- |
| change it            | add `c.x`   | remove `a.x`  |
| keep the description | add nothing | remove both   |

### ROL-EDT-05 Changes reach the assignments

Summary: Adding a permission to a role raises its permission count on the list and on the user's and group's Roles tabs.

Given role R is assigned to a user and a group
When I add a permission to R
Then the Permissions count of R rises in the Roles list, the user's Roles tab and the group's
Roles tab

## Delete

### ROL-DEL-01 Delete

Summary: Deleting a role removes it and cascades to its assignments, removing them from holders.

Given an unlocked role <assigned>
When I open "Delete" from the Roles list and confirm
Then the dialog "Delete Role" shows `Are you sure you want to delete the role "<name>"? This
action cannot be undone.`, and on confirming the toast `Role "<name>" deleted` appears and
<outcome>

| assigned               | outcome                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------- |
| not assigned to anyone | the role is gone                                                                    |
| assigned to a user     | the role is gone, and so is the assignment: the user's Roles tab no longer lists it |

Pulp deletes a role's assignments with it, without warning; the holders lose the permissions the
role gave them.
