---
area: groups
routes: [/admin/groups, /admin/groups/$groupId]
---

# Groups

Shared behaviour that also applies here:

- Table filter, sort, paging, empty states: [data-list.md](shared/data-list.md) — Groups,
  Group users, Group roles, Select users, Select roles (group).
- Create and edit modal lifecycle: [form-modal.md](shared/form-modal.md) — Create group, Edit
  group.
- Delete and remove dialogs: [confirm-dialog.md](shared/confirm-dialog.md) — Delete group,
  Remove user from group, Remove role from group.
- Add modals: [batch-add-modal.md](shared/batch-add-modal.md) — Add user to group, Add role to
  group.
- Roles tab: ROLE-ASSIGN scenarios in [roles.md](roles.md), with owner = group.

## List

### GRP-LIST-01 Row content

When I open the Groups list
Then each row shows the group name as a link and a row actions menu with "Edit" and "Delete"

## Permissions

Groups are the only admin area whose actions follow the logged-in user's permissions on each
group. A missing permission disables the action (it stays visible) with a tooltip.

### GRP-PERM-01 Gated actions follow the user's permission on the group

Auth: second-user

> **Layering:** the full gate matrix (every action × every permission combination → enabled or
> disabled with which tooltip) is a **component test**
> (`client/src/app/components/GatedButton.test.tsx` + `useObjectPermissions.test.ts`). This e2e
> keeps only one representative pair, to prove the group page wires the real backend permissions
> to the gate.

Given a second user who holds a role on group G (not a global role) granting view plus <change>
and <delete>
When they open the Groups list
Then the row's Edit and Delete follow <state>

| change | delete | Edit                                                          | Delete                                                        |
| ------ | ------ | ------------------------------------------------------------- | ------------------------------------------------------------- |
| no     | no     | disabled, tooltip "You don't have permission to change this." | disabled, tooltip "You don't have permission to delete this." |
| yes    | yes    | enabled                                                       | enabled                                                       |

The detail page's actions and the Users tab's "Add User"/"Remove" use the same gate and are not
retested per surface. When "Add User" is enabled for a non-superuser, its modal still shows
"403: Access denied" because Pulp lets only superusers list users, so in practice only
superusers add members from the UI.

### GRP-PERM-02 Disabled actions do nothing

Auth: second-user

Given an action is disabled by [GRP-PERM-01](#grp-perm-01-gated-actions-follow-the-users-permission-on-the-group)
When the second user clicks it
Then no modal or dialog opens

### GRP-PERM-03 Permissions are per group

Auth: second-user

Given a second user with change and delete on group G1 and only view on group G2
When they open the Groups list
Then G1's Edit and Delete are enabled and G2's are disabled, on the same page

### GRP-PERM-04 Permissions granted through a group or a global role

Auth: second-user

Given a second user who gets change on groups <how>
Then Pulp lets them change <which groups>, and the gated "change" actions should be enabled
for those groups

Main cases (an object role that works today, and a global role the UI misses):

| how                    | which groups | UI today                |
| ---------------------- | ------------ | ----------------------- |
| a role on group G only | G only       | enabled for G           |
| a global role          | every group  | disabled on every group |

UI gap: the UI reads `my_permissions/`, which only returns roles held on that group, so a
global role is not seen and the actions stay disabled although Pulp allows them. No endpoint
exposes a non-superuser's global roles, so these rows are expected to fail.

### GRP-PERM-05 Nothing is disabled while permissions load

Given the permission check is slow
When the Groups list or a group detail page first shows
Then the gated actions are enabled until the check finishes, then follow [GRP-PERM-01](#grp-perm-01-gated-actions-follow-the-users-permission-on-the-group)

### GRP-PERM-06 The admin sees everything enabled

Given the admin (a superuser), who may do anything in Pulp
Then every gated action ([GRP-PERM-01](#grp-perm-01-gated-actions-follow-the-users-permission-on-the-group)) is enabled, even on a group the admin holds no role on

`my_permissions/` ignores superuser status, so the UI checks it separately
([ADR 0011](../../docs/adr/0011-permission-aware-actions.md)).

### GRP-PERM-07 Create is not gated

Auth: second-user

Given a second user without the global permission to add groups
Then "Create Group" is enabled, and submitting fails with the server's reason ([FORM-10](shared/form-modal.md#form-10-permission-denied-on-submit))

## Create

> **Layering:** form fields/defaults and client-side validation (the "required" and format
> rows) are component tests (see the form modal's `*.test.tsx`). The rows below keep only the
> **server** outcomes and the **main** cases, not every permutation.

### GRP-CRE-01 Form

When I click "Create Group"
Then the "Create Group" modal shows a single required field, Name

### GRP-CRE-02 Name

The server's name rules (trimmed, unique, blank, 150-char limit) are an **api contract** test
(`groups.api.spec.ts`); the client "required" check is a component test. The e2e create journey
is GRP-CRE-03, and the generic "the form surfaces a server rejection" is
[FORM-09](shared/form-modal.md#form-09-server-rejection-shows-in-the-form).

### GRP-CRE-03 The new group appears

When I create a group
Then the toast `Group "<name>" created` appears and the group is in the Groups list

## Edit

### GRP-EDT-01 Rename from the list

Given a group
When I rename it from Groups › row › Edit
Then the toast `Group "<new name>" updated` appears and the new name shows in the Groups list

Renaming from the detail page is the same modal and is not retested separately (the detail
page's own header/breadcrumb/title then reflect the new name).

### GRP-EDT-02 Rename shows on related pages

Given user U is in group G
When I rename G
Then U's Groups tab shows the new name

## Delete

### GRP-DEL-01 Delete from the list

Given a group with <contents>
When I delete it from the Groups list
Then the group is gone ([CONF-03](shared/confirm-dialog.md#conf-03-confirming)) and <aftermath>

| contents                | aftermath                                                      |
| ----------------------- | -------------------------------------------------------------- |
| no users, no roles      | —                                                              |
| two users               | each user's Groups tab no longer lists it, Users list count −1 |
| global and object roles | its role assignments are gone                                  |

Deleting from the detail page is the same dialog; its extra behaviour (the list opens, no stale
request) is [CONF-06](shared/confirm-dialog.md#conf-06-no-stale-requests-after-deleting-from-a-detail-page).

### GRP-DEL-02 Members lose permissions that came through the group

Deleting a group removes its members' membership, the same mechanism as removing a user from a
group. That a group's roles reach (and stop reaching) a second user through the UI is covered by
the one representative RBAC-effect e2e, [GRP-USR-06](#grp-usr-06-adding-a-user-grants-the-groups-roles);
this variation is not tested separately.

## Detail page

### GRP-DET-01 Header and tabs

When I open a group's detail page
Then the header shows the group name, an actions menu with "Edit Group" and "Delete Group",
and tabs "Users (n)" and "Roles (n)", with Users selected

### GRP-DET-02 Tab counts

Given a group with <u> users and <r> role assignments
When I open its detail page
Then the tabs read "Users (<u>)" and "Roles (<r>)"

Main cases (each count value once; 12 is above a page, so it proves totals not visible rows):

| u   | r   |
| --- | --- |
| 0   | 0   |
| 1   | 12  |
| 12  | 1   |

### GRP-DET-03 Counts update without a reload

When I <action> on the group detail page
Then <tab> changes by <change> without a reload

Main cases (add +1/+2 and remove −1, across the two tabs):

| action          | tab       | change |
| --------------- | --------- | ------ |
| add two users   | Users (n) | +2     |
| remove one user | Users (n) | −1     |
| add one role    | Roles (n) | +1     |

## Users tab

### GRP-USR-01 Paging only

When I open the Users tab
Then there is no filter and no sort control, only paging ([LIST-15](shared/data-list.md#list-15-paging-controls), [LIST-16](shared/data-list.md#list-16-page-size))
And each username links to its user detail page
And Pulp does not guarantee the members' order, so a test must not depend on it

### GRP-USR-02 The Add User modal's Name column

Given a user with first name <first> and last name <last>
When I open "Add User"
Then that user's Name cell is <cell>

Main cases (both names, and neither):

| first   | last     | cell         |
| ------- | -------- | ------------ |
| Ada     | Lovelace | Ada Lovelace |
| (empty) | (empty)  | —            |

And Email shows "—" when the user has none.

### GRP-USR-03 Add users

When I add users with "Add User" ([BATCH-07](shared/batch-add-modal.md#batch-07-every-outcome-of-an-add))
Then they are listed in the Users tab

### GRP-USR-04 Remove a user

When I remove a user from the Users tab ([CONF-03](shared/confirm-dialog.md#conf-03-confirming))
Then they are no longer listed, and the action is gated as in [GRP-PERM-01](#grp-perm-01-gated-actions-follow-the-users-permission-on-the-group)

### GRP-USR-06 Adding a user grants the group's roles

Auth: second-user

Given group G has a role that lets members change repositories
When I add the second user to G
Then their repository change actions become enabled
When I remove them from G
Then those actions become disabled again
