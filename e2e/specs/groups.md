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

### GRP-PERM-01 Every permission combination on every gated action

Auth: second-user

Given a second user who holds a role on group G (not a global role) that grants view plus
<change> and <delete>
When they look at <action>
Then it is <state>

| change | delete | action                            | state                                                         |
| ------ | ------ | --------------------------------- | ------------------------------------------------------------- |
| yes    | yes    | Groups list › row "Edit"          | enabled                                                       |
| yes    | yes    | Groups list › row "Delete"        | enabled                                                       |
| yes    | yes    | detail › actions › "Edit Group"   | enabled                                                       |
| yes    | yes    | detail › actions › "Delete Group" | enabled                                                       |
| yes    | yes    | detail › Users › "Add User"       | enabled                                                       |
| yes    | yes    | detail › Users › row "Remove"     | enabled                                                       |
| yes    | no     | Groups list › row "Edit"          | enabled                                                       |
| yes    | no     | Groups list › row "Delete"        | disabled, tooltip "You don't have permission to delete this." |
| yes    | no     | detail › actions › "Edit Group"   | enabled                                                       |
| yes    | no     | detail › actions › "Delete Group" | disabled, tooltip "You don't have permission to delete this." |
| yes    | no     | detail › Users › "Add User"       | enabled                                                       |
| yes    | no     | detail › Users › row "Remove"     | enabled                                                       |
| no     | yes    | Groups list › row "Edit"          | disabled, tooltip "You don't have permission to change this." |
| no     | yes    | Groups list › row "Delete"        | enabled                                                       |
| no     | yes    | detail › actions › "Edit Group"   | disabled, tooltip "You don't have permission to change this." |
| no     | yes    | detail › actions › "Delete Group" | enabled                                                       |
| no     | yes    | detail › Users › "Add User"       | disabled, tooltip "You don't have permission to change this." |
| no     | yes    | detail › Users › row "Remove"     | disabled, tooltip "You don't have permission to change this." |
| no     | no     | Groups list › row "Edit"          | disabled, tooltip "You don't have permission to change this." |
| no     | no     | Groups list › row "Delete"        | disabled, tooltip "You don't have permission to delete this." |
| no     | no     | detail › actions › "Edit Group"   | disabled, tooltip "You don't have permission to change this." |
| no     | no     | detail › actions › "Delete Group" | disabled, tooltip "You don't have permission to delete this." |
| no     | no     | detail › Users › "Add User"       | disabled, tooltip "You don't have permission to change this." |
| no     | no     | detail › Users › row "Remove"     | disabled, tooltip "You don't have permission to change this." |

When "Add User" is enabled for a non-superuser, its modal still shows "403: Access denied"
instead of users, because Pulp lets only superusers list users. In practice only
superusers can add members from the UI.

### GRP-PERM-02 Disabled actions do nothing

Auth: second-user

Given an action is disabled by [GRP-PERM-01](#grp-perm-01-every-permission-combination-on-every-gated-action)
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

| how                                               | which groups | UI today                |
| ------------------------------------------------- | ------------ | ----------------------- |
| a role on group G only                            | G only       | enabled for G           |
| a role given to a group they belong to, on G only | G only       | enabled for G           |
| a global role                                     | every group  | disabled on every group |
| a global role given to a group they belong to     | every group  | disabled on every group |

UI gap: the UI reads `my_permissions/`, which only returns roles held on that group, so a
global role is not seen and the actions stay disabled although Pulp allows them.

### GRP-PERM-05 Nothing is disabled while permissions load

Given the permission check is slow
When the Groups list or a group detail page first shows
Then the gated actions are enabled until the check finishes, then follow [GRP-PERM-01](#grp-perm-01-every-permission-combination-on-every-gated-action)

### GRP-PERM-06 The admin sees everything enabled

Given the admin (a superuser), who may do anything in Pulp
Then every action in [GRP-PERM-01](#grp-perm-01-every-permission-combination-on-every-gated-action) is enabled, on <group>

| group                           | UI today                                |
| ------------------------------- | --------------------------------------- |
| a group the admin created       | enabled (the creator becomes its owner) |
| a group created by someone else | disabled                                |

UI gap: `my_permissions/` ignores superuser status and global roles, so the admin's actions
are disabled on groups it holds no role on, although Pulp allows them.

### GRP-PERM-07 Create is not gated

Auth: second-user

Given a second user without the global permission to add groups
Then "Create Group" is enabled, and submitting fails with the server's reason ([FORM-10](shared/form-modal.md#form-10-permission-denied-on-submit))

## Create

### GRP-CRE-01 Form

When I click "Create Group"
Then the "Create Group" modal shows a single required field, Name

### GRP-CRE-02 Name

When I enter the name <name> and submit
Then <outcome>

| name                               | outcome                                                            |
| ---------------------------------- | ------------------------------------------------------------------ |
| (empty)                            | "Name is required"; nothing is sent                                |
| only spaces                        | in-form error "This field may not be blank."                       |
| a new simple name                  | the group is created                                               |
| with spaces around it (`  ops  `)  | the group is created as `ops` (Pulp trims the spaces)              |
| an existing group's name           | in-form error "This field must be unique."                         |
| an existing name in different case | the group is created (names are case-sensitive)                    |
| with symbols (`ops-team_2.0`)      | the group is created                                               |
| with spaces inside (`ops team`)    | the group is created                                               |
| unicode (`équipe 日本`)            | the group is created                                               |
| exactly 150 characters             | the group is created                                               |
| 151 characters                     | in-form error "Ensure this field has no more than 150 characters." |

### GRP-CRE-03 The new group appears

When I create a group
Then the toast `Group "<name>" created` appears and the group is in the Groups list

## Edit

### GRP-EDT-01 Rename from every entry point

Given a group
When I rename it from <entry>
Then the toast `Group "<new name>" updated` appears and the new name shows in <places>

| entry                                 | places                                                    |
| ------------------------------------- | --------------------------------------------------------- |
| Groups › row › Edit                   | Groups list                                               |
| group detail › actions › "Edit Group" | detail header, breadcrumb, browser tab title, Groups list |

### GRP-EDT-02 Rename shows on related pages

Given user U is in group G
When I rename G
Then U's Groups tab shows the new name

### GRP-EDT-03 Rename to an invalid name

When I rename a group to <name>
Then <outcome>

| name                 | outcome                                    |
| -------------------- | ------------------------------------------ |
| (empty)              | "Name is required"; nothing is sent        |
| another group's name | in-form error "This field must be unique." |
| its own current name | the toast `Group "<name>" updated` appears |

### GRP-EDT-04 The edit form shows the current name

When I open the edit modal
Then the title is "Edit <name>" and Name holds the current name

## Delete

### GRP-DEL-01 Delete from every entry point

Given a group with <contents>
When I delete it from <entry>
Then the group is gone ([CONF-03](shared/confirm-dialog.md#conf-03-confirming)) and <aftermath>

| contents                | entry  | aftermath                                                      |
| ----------------------- | ------ | -------------------------------------------------------------- |
| no users, no roles      | list   | —                                                              |
| no users, no roles      | detail | the Groups list opens                                          |
| two users               | list   | each user's Groups tab no longer lists it, Users list count −1 |
| two users               | detail | the same                                                       |
| global and object roles | list   | its role assignments are gone                                  |
| global and object roles | detail | the same                                                       |

### GRP-DEL-02 Members lose permissions that came through the group

Auth: second-user

Given a second user who can change repositories only through a role on group G
When I delete G
Then the second user's repository change actions become disabled

## Detail page

### GRP-DET-01 Header and tabs

When I open a group's detail page
Then the header shows the group name, an actions menu with "Edit Group" and "Delete Group",
and tabs "Users (n)" and "Roles (n)", with Users selected

### GRP-DET-02 Tab counts

Given a group with <u> users and <r> role assignments
When I open its detail page
Then the tabs read "Users (<u>)" and "Roles (<r>)"

| u   | r   |
| --- | --- |
| 0   | 0   |
| 0   | 1   |
| 0   | 12  |
| 1   | 0   |
| 1   | 1   |
| 1   | 12  |
| 12  | 0   |
| 12  | 1   |
| 12  | 12  |

### GRP-DET-03 Counts update without a reload

When I <action> on the group detail page
Then <tab> changes by <change> without a reload

| action          | tab       | change |
| --------------- | --------- | ------ |
| add one user    | Users (n) | +1     |
| add two users   | Users (n) | +2     |
| remove one user | Users (n) | −1     |
| add one role    | Roles (n) | +1     |
| add two roles   | Roles (n) | +2     |
| remove one role | Roles (n) | −1     |

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

| first   | last     | cell         |
| ------- | -------- | ------------ |
| Ada     | Lovelace | Ada Lovelace |
| Ada     | (empty)  | Ada          |
| (empty) | Lovelace | Lovelace     |
| (empty) | (empty)  | —            |

And Email shows "—" when the user has none.

### GRP-USR-03 Add users

When I add users with "Add User" ([BATCH-07](shared/batch-add-modal.md#batch-07-every-outcome-of-an-add))
Then they are listed in the Users tab

### GRP-USR-04 Remove a user

When I remove a user from the Users tab ([CONF-03](shared/confirm-dialog.md#conf-03-confirming))
Then they are no longer listed, and the action is gated as in [GRP-PERM-01](#grp-perm-01-every-permission-combination-on-every-gated-action)

### GRP-USR-05 Both sides stay in sync

| done on                   | then shown on                                                                    |
| ------------------------- | -------------------------------------------------------------------------------- |
| G › Users › add user U    | U's detail › Groups lists G (already-open page, no reload); Users list Groups +1 |
| G › Users › remove user U | U's detail › Groups no longer lists G; Users list Groups −1                      |

### GRP-USR-06 Adding a user grants the group's roles

Auth: second-user

Given group G has a role that lets members change repositories
When I add the second user to G
Then their repository change actions become enabled
When I remove them from G
Then those actions become disabled again
