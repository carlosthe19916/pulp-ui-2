---
area: users
routes: [/admin/users, /admin/users/$userId]
---

# Users

Shared behaviour that also applies here:

- Table filter, sort, paging, empty states: [data-list.md](shared/data-list.md) — Users, User
  groups, User roles, Select groups, Select roles (user).
- Create and edit modal lifecycle: [form-modal.md](shared/form-modal.md) — Create user, Edit
  user.
- Delete and remove dialogs: [confirm-dialog.md](shared/confirm-dialog.md) — Delete user,
  Remove group from user, Remove role from user.
- Add modals: [batch-add-modal.md](shared/batch-add-modal.md) — Add group to user, Add role to
  user.
- Roles tab: ROLE-ASSIGN scenarios in [roles.md](roles.md), with owner = user.

## List

### USR-LIST-01 Row content

Given a user with <email>, <active> and member of <groups> groups
When I find the user in the Users list
Then the row shows Email <email cell>, Active <label>, Groups <groups> and a formatted Date
Joined

Main cases (each value of email, active and group count at least once), not the full grid:

| email             | active | groups | email cell        | label    |
| ----------------- | ------ | ------ | ----------------- | -------- |
| alice@example.com | yes    | 0      | alice@example.com | Active   |
| (none)            | no     | 1      | —                 | Inactive |
| alice@example.com | yes    | 2      | alice@example.com | Active   |

### USR-LIST-02 Row actions

When I open a user's row actions
Then "Edit" and "Delete" are offered and both are enabled

### USR-LIST-03 Only superusers can manage users

Auth: second-user

Given a second user who is not a superuser (with or without Staff status)
When they open the Users list
Then the table shows "403: Access denied" and no row actions are reachable

> Note: Pulp lets only superusers list, view, create, change or delete users, so anyone who
> can see a user's row may also edit and delete it. That is why Edit and Delete have no
> permission check ([ADR 0011](../../docs/adr/0011-permission-aware-actions.md)).

### USR-LIST-04 The Create button is always enabled

Auth: second-user

Given a second user who is not a superuser
Then "Create user" is enabled, and submitting fails with the server's reason ([FORM-10](shared/form-modal.md#form-10-permission-denied-on-submit))

## Create

> **Layering:** form fields/defaults and client-side validation (the "required" and format
> rows) are component tests (see the form modal's `*.test.tsx`). The rows below keep only the
> **server** outcomes and the **main** cases, not every permutation.

### USR-CRE-01 Form fields and defaults

When I click "Create user"
Then the "Create User" modal shows, in order: Username (required), Password (required, hidden
text), Email, First name, Last name, Active (checked), Staff status (unchecked)

### USR-CRE-02 Username

The server's username rules (trimmed, unique, blank, 150-char limit) are an **api contract**
test (`users.api.spec.ts`); the client "required" check is a component test. The e2e create
journey is covered by USR-CRE-05..08, and the generic "the form surfaces a server rejection" by
[FORM-09](shared/form-modal.md#form-09-server-rejection-shows-in-the-form).

### USR-CRE-03 Password

The server's password rules (too common, all-numeric, blank) are an **api contract** test
(`users.api.spec.ts`); the client "required" / "min length" checks are a component test.

### USR-CRE-04 Email

The server's email rules (format, optional, non-unique) are an **api contract** test
(`users.api.spec.ts`); the client "invalid format" check is a component test.

### USR-CRE-05 Active and Staff status

Given I open "Create User" with a valid username and password
When I set Active <active> and Staff status <staff> and submit
Then the user is created, the list shows <label>, and the saved user has active <active> and
staff <staff>

Main cases (each flag set once), not the full grid:

| active    | staff     | label    |
| --------- | --------- | -------- |
| checked   | unchecked | Active   |
| unchecked | checked   | Inactive |

### USR-CRE-06 Optional text fields

Given I open "Create User" with a valid username and password
When I fill Email <email>, First name <first> and Last name <last> and submit
Then the user is created with exactly the fields I filled, and the empty ones are blank

Main cases (all empty, all filled, mixed), not the full 8-way grid:

| email  | first  | last   |
| ------ | ------ | ------ |
| empty  | empty  | empty  |
| filled | filled | filled |
| filled | empty  | empty  |

### USR-CRE-07 The new user appears

When I create a user
Then the toast `User "<username>" created` appears and the user is in the Users list with
Groups 0

### USR-CRE-08 The new user can log in

Auth: second-user

Given I create a user with <active>
When that user logs in with the password I set
Then <outcome>

| active    | outcome               |
| --------- | --------------------- |
| checked   | they are logged in    |
| unchecked | the login is rejected |

## Edit

### USR-EDT-01 Form fields

When I open Edit (Users › row › Edit) for a user
Then the "Edit <username>" modal shows Email, First name, Last name, Active and Staff status
filled with the saved values
And Username and Password are not shown

The edit modal opened from the detail page is the same modal, so it is not retested separately.

### USR-EDT-02 Changing one field

Given a user with every field filled
When I change <field> from the Users list and save
Then the toast `User "<username>" updated` appears, the Users list shows the new Email, and
"Edit User" on the detail page shows the new value (cross-page sync, see
[FORM-12](shared/form-modal.md#form-12-success))

| field      |
| ---------- |
| Email      |
| First name |
| Last name  |

### USR-EDT-03 Changing several fields at once

Given a user with every field filled
When I change <fields> and save
Then every changed field is saved and the others are unchanged

Main cases (a text pair, a text+flag pair, every field), not every combination:

| fields            |
| ----------------- |
| Email, First name |
| Email, Active     |
| every field       |

### USR-EDT-04 Active / Staff status transitions

Given a user with Active <from active> and Staff status <from staff>
When I edit them to Active <to active> and Staff status <to staff>
Then the change is saved and the list label matches <to active>

Representative transitions that flip each flag both ways (each value once), not all 12:

| from active | from staff | to active | to staff |
| ----------- | ---------- | --------- | -------- |
| on          | off        | off       | on       |
| off         | on         | on        | off      |

### USR-EDT-05 Clearing a text field

Given a user with Email filled
When I clear Email and save
Then the saved user has Email empty and the list shows "—"

UI gap: Pulp accepts an empty value, but the form leaves empty fields out of the update, so
today the old value is kept. This is the one representative of this gap across the admin forms
(the same applies to role description, [ROL-EDT-03](roles.md#rol-edt-03-clearing-the-description),
and the policy optional fields, [ACP-EDT-05](access-policies.md#acp-edt-05-clearing-an-optional-field)).

### USR-EDT-06 Invalid email on edit

When I change Email to `not-an-email`
Then "Invalid email address" shows and nothing is sent

### USR-EDT-07 Saving without changes

When I open the edit modal and click "Save" without changing anything
Then the toast `User "<username>" updated` appears and nothing changes

### USR-EDT-08 Deactivating stops login

Auth: second-user

Given a second user who can log in
When I edit them to Active unchecked
Then their next login is rejected
When I edit them back to Active checked
Then they can log in again

## Delete

### USR-DEL-01 Delete from the list

Given a user with <memberships>
When I delete them from the Users list
Then the user is gone ([CONF-03](shared/confirm-dialog.md#conf-03-confirming)) and <aftermath>

| memberships                  | aftermath                                                       |
| ---------------------------- | --------------------------------------------------------------- |
| no groups, no roles          | —                                                               |
| in two groups                | each group's Users tab no longer lists them, counts drop by one |
| with global and object roles | their assignments are gone                                      |

Deleting from the detail page is the same dialog; its only extra behaviour (the list opens, no
stale request) is [CONF-06](shared/confirm-dialog.md#conf-06-no-stale-requests-after-deleting-from-a-detail-page).

### USR-DEL-02 Deleting the logged-in user

Manual

Pulp's API can't create a superuser (it ignores `is_superuser`), so this needs one made with
`pulpcore-manager`.

Given a second superuser logged in (never the e2e admin)
When they delete their own user
Then Pulp allows it: the toast `User "<username>" deleted` appears and their next request is
rejected as not logged in
And Open: decide what the UI shows after that (for example the login page)

### USR-DEL-03 A deleted user's URL

Given I deleted a user
When I open their old detail URL
Then "404: That page does not exist" is displayed ([NAV-07](shared/navigation.md#nav-07-detail-route-error-states))

## Detail page

### USR-DET-01 Header and tabs

When I open a user's detail page
Then the header shows the username, an actions menu with "Edit User" and "Delete User", and
tabs "Groups (n)" and "Roles (n)", with Groups selected

### USR-DET-02 Tab counts

Given a user in <g> groups with <r> role assignments
When I open their detail page
Then the tabs read "Groups (<g>)" and "Roles (<r>)"

Main cases (each count value once; 12 is above a page, so it proves totals not visible rows):

| g   | r   |
| --- | --- |
| 0   | 0   |
| 1   | 12  |
| 12  | 1   |

### USR-DET-03 Counts update without a reload

Given I am on a user's detail page
When I <action>
Then <tab> changes by <change> without a reload

Main cases (add +1/+2 and remove −1, across the two tabs):

| action           | tab        | change |
| ---------------- | ---------- | ------ |
| add two groups   | Groups (n) | +2     |
| remove one group | Groups (n) | −1     |
| add one role     | Roles (n)  | +1     |

### USR-DET-05 Switching tabs

When I switch between Groups and Roles and back
Then each tab shows its own table, and the filter typed in one tab does not affect the other

## Groups tab

### USR-GRP-01 Only the user's own groups

Seed: groups the user is in and groups they are not in

When I open the user's Groups tab
Then only the groups they belong to are listed

### USR-GRP-02 A user with no groups

Given a user who belongs to no group, while other groups exist
When I open their Groups tab
Then "User is not a member of any group" shows, and no other group is listed

### USR-GRP-03 Add and remove

When I add a group with "Add Group" ([BATCH-07](shared/batch-add-modal.md#batch-07-every-outcome-of-an-add))
Then it is listed in the Groups tab
When I remove it ([CONF-03](shared/confirm-dialog.md#conf-03-confirming))
Then it is no longer listed

### USR-GRP-04 Remove needs no permission check

Only superusers can open a user's detail page (Pulp makes users superuser-only), and a
superuser may always change a group's members. So "Remove" is always enabled here, unlike
the group's Users tab ([GRP-USR-04](groups.md#grp-usr-04-remove-a-user)), which non-superusers can reach.

When the admin opens a user's Groups tab
Then "Remove" is enabled on every group

### USR-GRP-05 Both sides stay in sync

This is the one representative of user↔group cross-page sync (the group's Users tab reflects
the same relationship, so it is not retested from that side).

| done on                        | then shown on                                  |
| ------------------------------ | ---------------------------------------------- |
| user › Groups › add group G    | G › Users lists the user; Users list Groups +1 |
| user › Groups › remove group G | G › Users no longer lists the user             |

### USR-GRP-06 The "Add Group" button

Then "Add Group" is always enabled (no permission check)
