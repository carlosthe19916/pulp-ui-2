---
area: roles
routes: [/admin/roles]
---

# Roles and role assignments

Shared behaviour that also applies here:

- Table filter, sort, paging, empty states: [data-list.md](shared/data-list.md) — Roles, User
  roles, Group roles, Select roles.
- Create and edit modal lifecycle: [form-modal.md](shared/form-modal.md) — Create role, Edit
  role.
- Delete and remove dialogs: [confirm-dialog.md](shared/confirm-dialog.md) — Delete role,
  Remove role from user, Remove role from group.
- Add modals: [batch-add-modal.md](shared/batch-add-modal.md) — Add role to user, Add role to
  group.

Roles have no detail page.

## List

### ROL-LIST-01 Row content

Given a role named <name> with description <description>, <n> permissions and locked <locked>
When I find it in the Roles list
Then the row shows Name <name> (plain text), Plugin <plugin>, Description <cell>, Permissions
<n> and Locked <label>

| name                      | description    | n   | locked | plugin                    | cell                     | label |
| ------------------------- | -------------- | --- | ------ | ------------------------- | ------------------------ | ----- |
| core.task_owner           | (built-in)     | ≥1  | yes    | core                      | the description, or —    | Yes   |
| file.filerepository_owner | (built-in)     | ≥1  | yes    | file                      | the description, or —    | Yes   |
| custom.reader             | Reads things   | 1   | no     | custom                    | Reads things             | No    |
| reader                    | (empty)        | 0   | no     | other                     | —                        | No    |
| a.b.c                     | (empty)        | 2   | no     | a                         | —                        | No    |
| .leading                  | (empty)        | 0   | no     | Open: empty label; decide | —                        | No    |
| trailing.                 | (empty)        | 0   | no     | trailing                  | —                        | No    |
| custom.long               | 500 characters | 0   | no     | custom                    | cut off with an ellipsis | No    |

### ROL-LIST-02 Locked filter

Given the Roles list
When I choose <option> in the Locked filter
Then <rows> are listed and the filter shows <option>

| option    | rows                       |
| --------- | -------------------------- |
| All roles | locked and unlocked roles  |
| Locked    | only roles with Locked Yes |
| Unlocked  | only roles with Locked No  |

### ROL-LIST-03 Locked filter combined with the name filter and sort

Seed: an unlocked role whose name shares a text with a built-in locked role (`e2e-match`
below); Pulp can't create locked roles, so the locked one is built in

When I choose Locked <option>, type <name filter> and sort by <sort>
Then the listed rows are exactly <rows>, in the sort order

| option    | name filter | sort              | rows                          |
| --------- | ----------- | ----------------- | ----------------------------- |
| All roles | (empty)     | Name ascending    | every role                    |
| All roles | (empty)     | Locked descending | every role, locked first      |
| All roles | e2e-match   | Name ascending    | both seeded roles             |
| All roles | e2e-match   | Locked ascending  | both, unlocked first          |
| All roles | no-match    | Name ascending    | none — "No results found"     |
| Locked    | (empty)     | Name ascending    | every locked role             |
| Locked    | (empty)     | Name descending   | every locked role, reversed   |
| Locked    | e2e-match   | Name ascending    | the seeded locked role        |
| Locked    | no-match    | Name ascending    | none — "No results found"     |
| Unlocked  | (empty)     | Name ascending    | every unlocked role           |
| Unlocked  | (empty)     | Name descending   | every unlocked role, reversed |
| Unlocked  | e2e-match   | Name ascending    | the seeded unlocked role      |
| Unlocked  | no-match    | Name ascending    | none — "No results found"     |

### ROL-LIST-04 Clearing both filters

Given Locked is <option> and the name filter is <name filter>
When I click <clear>
Then the name filter is empty, Locked shows "All roles", page 1 shows every role

| option    | name filter | clear                                  |
| --------- | ----------- | -------------------------------------- |
| Locked    | (empty)     | "Clear filters" in the toolbar         |
| Unlocked  | e2e-match   | "Clear filters" in the toolbar         |
| Locked    | no-match    | "Clear all filters" in the empty state |
| Unlocked  | no-match    | "Clear all filters" in the empty state |
| All roles | no-match    | "Clear all filters" in the empty state |

### ROL-LIST-05 Locked filter alone gives the filtered empty state

Given no unlocked roles match (for example with the name filter of a locked role)
When I choose Unlocked
Then "No results found" with "Clear all filters" shows

## Locked roles

### ROL-LOCK-01 Locked roles cannot be edited or deleted

When I open the row actions of a role with Locked <locked>
Then Edit is <edit> and Delete is <delete>

| locked | edit                                              | delete                                             |
| ------ | ------------------------------------------------- | -------------------------------------------------- |
| Yes    | disabled, tooltip "Locked roles cannot be edited" | disabled, tooltip "Locked roles cannot be deleted" |
| No     | enabled                                           | enabled                                            |

And clicking a disabled action opens nothing.
And Pulp itself refuses to change or delete a locked role ("The role is locked."), so the
disabled actions match the backend.

### ROL-LOCK-02 Locked roles can still be assigned

When I open "Add Role" for a user or group
Then locked roles are listed and selectable, and adding one succeeds

## Create

> **Layering:** form fields/defaults and client-side validation (the "required" and format
> rows) are component tests (see the form modal's `*.test.tsx`). The rows below keep only the
> **server** outcomes and the **main** cases, not every permutation.

### ROL-CRE-01 Form

When I click "Create Role"
Then the "Create Role" modal shows Name (required), Description and Permissions (an input
with the hint "Type a permission (e.g. core.view_task) and press Enter")

### ROL-CRE-02 Name

When I enter the name <name> and submit
Then <outcome>

The client "required" check is a component test; these are the server outcomes and main cases.

| name                                     | outcome                                         |
| ---------------------------------------- | ----------------------------------------------- |
| `custom.reader` (with a plugin prefix)   | the role is created, Plugin "custom"            |
| `reader` (no dot)                        | the role is created, Plugin "other"             |
| very long (1000 characters)              | the role is created (Pulp sets no length limit) |
| only spaces                              | in-form error "This field may not be blank."    |
| an existing custom role's name           | in-form error "This field must be unique."      |
| a locked role's name (`core.task_owner`) | in-form error "This field must be unique."      |

### ROL-CRE-03 Description

When I create a role with description <description>
Then <outcome>

| description    | outcome                                  |
| -------------- | ---------------------------------------- |
| (empty)        | created, Description "—"                 |
| one line       | created, Description shows it            |
| 500 characters | created, Description cut off in the list |

### ROL-CRE-04 Permissions on create

When I create a role with permissions <permissions>
Then <outcome>

The tag input itself is a component test; these are the server outcomes and main cases.

| permissions               | outcome                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `core.view_task`          | created with Permissions 1                                                                 |
| `core.not_a_permission`   | in-form error "Permission 'core.not_a_permission' does not exist."                         |
| `not-a-codename` (no dot) | in-form error "Permission 'not-a-codename' is not in the format '<app_label>.<codename>'." |

### ROL-CRE-05 The new role appears

When I create a role
Then the toast `Role "<name>" created` appears and the role is in the Roles list, Locked No

## Permission input

> **Layering:** the tag input's own behaviour (ROL-PERM-01/02/03 — adding on Enter, trimming,
> dedupe, sorting, removing with × or Backspace, and folding past 10 behind "N more") is a
> component test (`.../RoleModal/PermissionInput.test.tsx`). e2e keeps only the parts that need
> the server: the case-sensitive permission that saves with an error, and the Open decision
> below.

### ROL-PERM-01 Typing permissions

Given the role form
When I <action>
Then the permission tags are <result>

| action                                                    | result                                                                                                    |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| type `core.view_task` and press Enter                     | `core.view_task`; the form is not submitted                                                               |
| press Enter with the input empty                          | unchanged                                                                                                 |
| type only spaces and press Enter                          | unchanged; the input is cleared                                                                           |
| type `  core.view_task  ` and press Enter                 | `core.view_task` (trimmed)                                                                                |
| add `core.view_task` twice                                | one `core.view_task`; the input is cleared                                                                |
| add `core.view_task`, then ` core.view_task` (spaced)     | one `core.view_task`                                                                                      |
| add `b.x`, then `a.x`, then `c.x`                         | `a.x`, `b.x`, `c.x` (always sorted)                                                                       |
| add `core.view_task`, then `Core.view_task`               | both, as two tags; saving fails with "Permission 'Core.view_task' does not exist." (Pulp matches exactly) |
| type `core.view_task` without pressing Enter, then submit | Open: the typed text is not added; decide if it should be                                                 |

### ROL-PERM-02 Removing permissions

Given tags `a.x`, `b.x`, `c.x`
When I <action>
Then the tags are <result>

| action                                           | result                                            |
| ------------------------------------------------ | ------------------------------------------------- |
| click × on `b.x` (labelled "Remove b.x")         | `a.x`, `c.x`                                      |
| press Backspace with the input empty             | `a.x`, `b.x`                                      |
| press Backspace three times with the input empty | none                                              |
| press Backspace with text in the input           | unchanged; only the text loses its last character |
| press Backspace with the input empty and no tags | none (nothing breaks)                             |

### ROL-PERM-03 Many permissions fold

Given I add <n> permissions
Then <shown>

| n   | shown                     |
| --- | ------------------------- |
| 0   | no tags                   |
| 1   | 1 tag                     |
| 10  | 10 tags, no overflow link |
| 11  | 10 tags and "1 more"      |
| 15  | 10 tags and "5 more"      |

When I click "N more"
Then every tag shows, with a link to show fewer

## Edit

### ROL-EDT-01 Form

When I click Edit on an unlocked role
Then the "Edit Role: <name>" modal shows Name with the current name, disabled, and
Description and Permissions with the saved values

### ROL-EDT-02 Every combination of changes

Given an unlocked role with a description and permissions `a.x`, `b.x`
When I <description change>, <add change> and <remove change> and save
Then the toast `Role "<name>" updated` appears and the saved role matches

| description change   | add change  | remove change  |
| -------------------- | ----------- | -------------- |
| keep the description | add nothing | remove nothing |
| keep the description | add nothing | remove `a.x`   |
| keep the description | add `c.x`   | remove nothing |
| keep the description | add `c.x`   | remove `a.x`   |
| change it            | add nothing | remove nothing |
| change it            | add nothing | remove `a.x`   |
| change it            | add `c.x`   | remove nothing |
| change it            | add `c.x`   | remove `a.x`   |
| keep the description | add nothing | remove both    |

(Use real permission codenames in the test, for example `core.view_task`.)

### ROL-EDT-03 Clearing the description

Given a role with a description
When I clear Description and save
Then the saved role has no description and the list shows "—"

UI gap: Pulp clears a description only when it receives null (it rejects an empty text), but
the form leaves an empty description out of the update, so today the old text is kept.

### ROL-EDT-04 Invalid permission on edit

When I add `core.not_a_permission` and save
Then the in-form error "Permission 'core.not_a_permission' does not exist." shows and the role
is unchanged

### ROL-EDT-05 Changes reach the assignments

Given role R is assigned to a user and a group
When I add a permission to R
Then the Permissions count of R increases in the Roles list, the user's Roles tab and the
group's Roles tab

## Delete

### ROL-DEL-01 Delete

Given an unlocked role <assigned>
When I delete it from the Roles list
Then <outcome>

| assigned                    | outcome                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------ |
| not assigned to anyone      | the role is gone ([CONF-03](shared/confirm-dialog.md#conf-03-confirming))            |
| assigned to a user          | the role is gone, and so is the assignment: the user's Roles tab no longer lists it  |
| assigned to a group         | the role is gone, and so is the assignment: the group's Roles tab no longer lists it |
| assigned on one object only | the role is gone, and so is the assignment                                           |

Pulp deletes a role's assignments with it, without warning. The holders lose the permissions
the role gave them.

## Role assignments (user and group Roles tabs)

These scenarios run for owner = user (user detail › Roles) and owner = group (group detail ›
Roles).

### ROLE-ASSIGN-01 Row content

Given the <owner> has role R assigned <scope>
When I open the <owner>'s Roles tab
Then a row shows Role R, its Description (or "—"), its Permissions count and a formatted
Created date

| owner | scope                             |
| ----- | --------------------------------- |
| user  | globally                          |
| user  | on one repository                 |
| user  | in one domain (Requires: domains) |
| group | globally                          |
| group | on one repository                 |
| group | in one domain (Requires: domains) |

Open: Pulp returns which object or domain each assignment is for, but the row does not show
it, so a role assigned twice (globally and on an object) shows as two identical-looking rows;
decide whether the UI should show the scope.

### ROLE-ASSIGN-02 Add roles

When I add roles with "Add Role" ([BATCH-07](shared/batch-add-modal.md#batch-07-every-outcome-of-an-add))
Then the toast "<n> role(s) added to <owner> "<name>"" appears and they are listed with a
new Created date

Run for owner = user and owner = group.

### ROLE-ASSIGN-03 Remove one assignment of a role assigned twice

Given the <owner> has role R globally and on one repository
When I remove one of the R rows
Then only that assignment is gone; the other R row stays

Run for owner = user and owner = group.

### ROLE-ASSIGN-04 Only superusers can read or change role assignments

Auth: second-user

Pulp lets only superusers list, add or remove a user's or group's role assignments. A user's
detail page is already superuser-only ([NAV-08](shared/navigation.md#nav-08-detail-pages-without-view-permission)); a group's is not.

Given a second user who may view group G but is not a superuser
When they open G's detail page
Then the tab reads "Roles (0)" and the Roles tab table shows "403: Access denied"
And "Add Role" is enabled, but its modal table shows "403: Access denied" too

### ROLE-ASSIGN-05 A role takes effect

Auth: second-user

Given a second user without permission to change repositories
When I assign them a role that grants it <how>
Then repository change actions become enabled for them
When I remove the assignment
Then those actions become disabled again

| how                                               | UI today                                   |
| ------------------------------------------------- | ------------------------------------------ |
| directly, globally                                | the actions stay disabled                  |
| through a group they belong to, globally          | the actions stay disabled                  |
| directly, on one repository only                  | only that repository's actions are enabled |
| through a group they belong to, on one repository | only that repository's actions are enabled |

Pulp honours every row. UI gap: the UI reads `my_permissions/`, which only returns roles held
on that one object, so global roles are not seen and the actions stay disabled.
