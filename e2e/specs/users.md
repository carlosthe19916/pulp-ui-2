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

| email             | active | groups | email cell        | label    |
| ----------------- | ------ | ------ | ----------------- | -------- |
| alice@example.com | yes    | 0      | alice@example.com | Active   |
| alice@example.com | yes    | 1      | alice@example.com | Active   |
| alice@example.com | yes    | 2      | alice@example.com | Active   |
| alice@example.com | no     | 0      | alice@example.com | Inactive |
| alice@example.com | no     | 1      | alice@example.com | Inactive |
| alice@example.com | no     | 2      | alice@example.com | Inactive |
| (none)            | yes    | 0      | —                 | Active   |
| (none)            | yes    | 1      | —                 | Active   |
| (none)            | yes    | 2      | —                 | Active   |
| (none)            | no     | 0      | —                 | Inactive |
| (none)            | no     | 1      | —                 | Inactive |
| (none)            | no     | 2      | —                 | Inactive |

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

### USR-CRE-01 Form fields and defaults

When I click "Create user"
Then the "Create User" modal shows, in order: Username (required), Password (required, hidden
text), Email, First name, Last name, Active (checked), Staff status (unchecked)

### USR-CRE-02 Username

Given I open "Create User" with a valid password
When I enter the username <username> and submit
Then <outcome>

| username                                | outcome                                                            |
| --------------------------------------- | ------------------------------------------------------------------ |
| (empty)                                 | "Username is required"; nothing is sent                            |
| only spaces                             | in-form error "This field may not be blank."                       |
| a new, simple name                      | the user is created                                                |
| with spaces around it (`  alice  `)     | the user is created as `alice` (Pulp trims the spaces)             |
| an existing username                    | in-form error "This field must be unique."; the modal stays open   |
| the existing username in different case | the user is created (usernames are case-sensitive)                 |
| with symbols (`a.b-c_d@e+f`)            | the user is created                                                |
| with a space inside (`a b`)             | the user is created (Pulp does not check the characters)           |
| with a slash (`a/b`)                    | the user is created                                                |
| unicode (`josé`)                        | the user is created                                                |
| exactly 150 characters                  | the user is created                                                |
| 151 characters                          | in-form error "Ensure this field has no more than 150 characters." |

### USR-CRE-03 Password

Given I open "Create User" with a valid new username
When I enter the password <password> and submit
Then <outcome>

| password                          | outcome                                              |
| --------------------------------- | ---------------------------------------------------- |
| (empty)                           | "Password is required"; nothing is sent              |
| 1 character                       | "Password must be at least 8 characters"             |
| 7 characters                      | "Password must be at least 8 characters"             |
| 8 characters, strong              | the user is created                                  |
| 128 characters, strong            | the user is created                                  |
| 8 characters, common (`password`) | in-form error "This password is too common."         |
| 8 digits (`12345678`)             | in-form error "This password is entirely numeric."   |
| similar to the username           | the user is created (Pulp does not check similarity) |
| only spaces, 8 long               | in-form error "This field may not be blank."         |

The password input hides what is typed.

### USR-CRE-04 Email

Given I open "Create User" with a valid username and password
When I enter the email <email> and submit
Then <outcome>

| email                 | outcome                                         |
| --------------------- | ----------------------------------------------- |
| (empty)               | the user is created with no email (shows "—")   |
| `alice@example.com`   | the user is created with that email             |
| `alice`               | "Invalid email address"                         |
| `alice@`              | "Invalid email address"                         |
| `@example.com`        | "Invalid email address"                         |
| `alice@example`       | in-form error "Enter a valid email address."    |
| `alice@localhost`     | the user is created                             |
| `alice @example.com`  | "Invalid email address"                         |
| an email already used | the user is created (emails need not be unique) |

### USR-CRE-05 Every combination of Active and Staff status

Given I open "Create User" with a valid username and password
When I set Active <active> and Staff status <staff> and submit
Then the user is created, the list shows <label>, and the saved user has active <active> and
staff <staff>

| active    | staff     | label    |
| --------- | --------- | -------- |
| checked   | unchecked | Active   |
| checked   | checked   | Active   |
| unchecked | unchecked | Inactive |
| unchecked | checked   | Inactive |

### USR-CRE-06 Every combination of optional text fields

Given I open "Create User" with a valid username and password
When I fill Email <email>, First name <first> and Last name <last> and submit
Then the user is created with exactly the fields I filled, and the empty ones are blank

| email  | first  | last   |
| ------ | ------ | ------ |
| empty  | empty  | empty  |
| filled | empty  | empty  |
| empty  | filled | empty  |
| empty  | empty  | filled |
| filled | filled | empty  |
| filled | empty  | filled |
| empty  | filled | filled |
| filled | filled | filled |

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

When I open <entry> for a user
Then the "Edit <username>" modal shows Email, First name, Last name, Active and Staff status
filled with the saved values
And Username and Password are not shown

| entry                               |
| ----------------------------------- |
| Users › row › Edit                  |
| user detail › actions › "Edit User" |

### USR-EDT-02 Changing one field

Given a user with every field filled
When I change <field> from <entry> and save
Then the toast `User "<username>" updated` appears, the Users list shows the new Email, and
"Edit User" on the detail page shows the new value

| field      | entry  |
| ---------- | ------ |
| Email      | list   |
| Email      | detail |
| First name | list   |
| First name | detail |
| Last name  | list   |
| Last name  | detail |

### USR-EDT-03 Changing several fields at once

Given a user with every field filled
When I change <fields> and save
Then every changed field is saved and the others are unchanged

| fields                       |
| ---------------------------- |
| Email, First name            |
| Email, Last name             |
| First name, Last name        |
| Email, First name, Last name |
| Email, Active                |
| First name, Staff status     |
| every field                  |

### USR-EDT-04 Every Active / Staff status transition

Given a user with Active <from active> and Staff status <from staff>
When I edit them to Active <to active> and Staff status <to staff>
Then the change is saved and the list label matches <to active>

| from active | from staff | to active | to staff |
| ----------- | ---------- | --------- | -------- |
| on          | off        | off       | off      |
| on          | off        | on        | on       |
| on          | off        | off       | on       |
| on          | on         | on        | off      |
| on          | on         | off       | on       |
| on          | on         | off       | off      |
| off         | off        | on        | off      |
| off         | off        | off       | on       |
| off         | off        | on        | on       |
| off         | on         | off       | off      |
| off         | on         | on        | on       |
| off         | on         | on        | off      |

### USR-EDT-05 Clearing a text field

Given a user with <field> filled
When I clear <field> and save
Then the saved user has <field> empty and the list shows "—" for an empty Email

UI gap: Pulp accepts an empty value, but the form leaves empty fields out of the update, so
today the old value is kept.

| field      |
| ---------- |
| Email      |
| First name |
| Last name  |

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

### USR-EDT-09 Staff status does not grant admin pages

Auth: second-user

Given a second user with Staff status checked and no roles
When they open the Users, Roles and Access policies lists
Then each table shows "403: Access denied": Pulp only lets superusers in, and Staff status
grants nothing

## Delete

### USR-DEL-01 Delete from every entry point

Given a user with <memberships>
When I delete them from <entry>
Then the user is gone ([CONF-03](shared/confirm-dialog.md#conf-03-confirming)) and <aftermath>

| memberships                  | entry  | aftermath                                                       |
| ---------------------------- | ------ | --------------------------------------------------------------- |
| no groups, no roles          | list   | —                                                               |
| no groups, no roles          | detail | the Users list opens                                            |
| in two groups                | list   | each group's Users tab no longer lists them, counts drop by one |
| in two groups                | detail | the same                                                        |
| with global and object roles | list   | their assignments are gone                                      |
| with global and object roles | detail | the same                                                        |

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

| g   | r   |
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

Counts above a page (12) prove they are totals, not the visible rows.

### USR-DET-03 Counts update without a reload

Given I am on a user's detail page
When I <action>
Then <tab> changes by <change> without a reload

| action           | tab        | change |
| ---------------- | ---------- | ------ |
| add one group    | Groups (n) | +1     |
| add two groups   | Groups (n) | +2     |
| remove one group | Groups (n) | −1     |
| add one role     | Roles (n)  | +1     |
| add two roles    | Roles (n)  | +2     |
| remove one role  | Roles (n)  | −1     |

### USR-DET-04 Edit from the detail page

When I edit the user from the actions menu
Then opening "Edit User" again shows the new values without a reload (the detail page shows
no other user fields)

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

| done on                        | then shown on                                  |
| ------------------------------ | ---------------------------------------------- |
| user › Groups › add group G    | G › Users lists the user; Users list Groups +1 |
| user › Groups › remove group G | G › Users no longer lists the user             |
| G › Users › add the user       | user › Groups lists G (no reload needed)       |
| G › Users › remove the user    | user › Groups no longer lists G                |

### USR-GRP-06 The "Add Group" button

Then "Add Group" is always enabled (no permission check)
