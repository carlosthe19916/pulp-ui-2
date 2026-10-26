---
area: users
routes: [/admin/users, /admin/users/$userId]
---

# Users

## List

### USR-LIST-01 Row content

When I open Users from the Administration navigation
Then the heading is "Users", the Users nav item is highlighted, the browser tab title contains
"Users", and the column headers are, in order: Username, Email, Active, Groups, Date Joined, actions
And each row shows the username as a link to that user's detail page, the Email (or "—"), an
Active or Inactive label, the Groups count, and a formatted Date Joined

Main cases (email present / absent, active / inactive, 0 / 1 groups):

| email             | active | groups | email cell        | label    |
| ----------------- | ------ | ------ | ----------------- | -------- |
| alice@example.com | yes    | 0      | alice@example.com | Active   |
| (none)            | no     | 1      | —                 | Inactive |

### USR-LIST-05 Filtering, sorting and paging

Seed: more than two pages of users

When I open the Users list
Then the rows are sorted by Username ascending
When I type a username substring in the Username filter
Then only matching users are listed, on page 1, and the item total matches
When I filter by a value that matches nothing
Then "No results found" shows with the text "No results match the current filter. Try adjusting
or clearing your filters." and a "Clear all filters" button that restores the rows
When I sort by Username descending, then by Date Joined
Then the rows reorder accordingly and stay on page 1
When I page through the results and change the page size to 20
Then the right rows and item range are shown

### USR-LIST-06 A non-superuser cannot read the Users list

Auth: second-user

Given a second user who is not a superuser (with or without Staff status)
When they open the Users list
Then the table shows "403: Access denied" and no rows (Pulp lets only superusers list users)

## Create

### USR-CRE-07 Create a user

When I click "Create user", fill a valid username and password, fill Email, First name and Last
name, set Active and Staff status, and submit
Then the modal closes, the toast `User "<username>" created` appears, and the user is in the
Users list with Groups 0 and the matching Active label, saved with exactly the fields and flags
I set

### USR-CRE-08 Active controls whether a user can log in

Auth: second-user

Given I create a user
When they try to log in with the password I set
Then an active user is logged in and an inactive user is rejected
When I edit an active user to Active unchecked
Then their next login is rejected
When I edit them back to Active checked
Then they can log in again

### USR-CRE-09 A duplicate username is rejected in the form

When I open "Create user" and submit a username that already exists
Then an in-form error shows the server's reason "This field must be unique.", no toast appears,
and the modal stays open with my values kept

### USR-CRE-10 Create is not gated for a non-superuser

Auth: second-user

Given a second user without permission to add users
Then "Create user" is enabled, and submitting a valid form shows the in-form error title
"Failed to create user" with the text "You do not have permission to perform this action. Ask an
administrator to grant the required role."

## Edit

### USR-EDT-03 Changing several fields at once

Given a user with every field filled
When I open Edit from the Users list, change a mix of fields including a flag (for example Email,
First name and Active), and save
Then the modal closes, the toast `User "<username>" updated` appears, every changed field is
saved and the others are unchanged, the list shows the new Email and label, and reopening Edit
on the detail page shows the new values

### USR-EDT-05 Clearing a text field

Given a user with Email filled
When I clear Email and save
Then the saved user has Email empty and the list shows "—"

UI gap: Pulp accepts an empty value, but the form leaves empty fields out of the update, so
today the old value is kept. This is the one representative of this gap across the admin forms.

## Delete

### USR-DEL-01 Delete from the list

Given a user with <memberships>
When I open "Delete" from the Users list
Then the dialog "Delete User" shows the body `Are you sure you want to delete "<username>"? This
action cannot be undone.` with a danger "Delete" button
When I confirm on a slow network
Then the button shows a spinner until the request finishes, then the dialog closes, the toast
`User "<username>" deleted` appears, the row is gone, and <aftermath>

| memberships         | aftermath                                                       |
| ------------------- | --------------------------------------------------------------- |
| no groups, no roles | —                                                               |
| in two groups       | each group's Users tab no longer lists them, counts drop by one |

### USR-DEL-02 Deleting the logged-in user

Manual

Pulp's API can't create a superuser (it ignores `is_superuser`), so this needs one made with
`pulpcore-manager`.

Given a second superuser logged in (never the e2e admin)
When they delete their own user
Then Pulp allows it: the toast `User "<username>" deleted` appears and their next request is
rejected as not logged in
And Open: decide what the UI shows after that (for example the login page)

### USR-DEL-04 Delete fails when the user is already gone

Given I open "Delete" for a user who is deleted through the API before I confirm
When I confirm
Then a danger toast shows the server's "not found" reason, the dialog stays open, and the row is
unchanged

### USR-DEL-05 Deleting from the detail page

When I delete a user from its detail page
Then the dialog is the same as from the list, the Users list opens afterwards, and no request
for the deleted user answers 404

## Detail page

### USR-DET-01 Header, tabs and counts

When I open a user's detail page
Then the header shows the username, an actions menu with "Edit User" and "Delete User", and tabs
"Groups (n)" and "Roles (n)" with Groups selected, where n is the real total (a user in 1 group
with 12 role assignments reads "Groups (1)" and "Roles (12)" — 12 is above a page, so it proves
totals, not visible rows)

### USR-DET-06 Opening a user detail page directly

When I open a user's detail URL (by typing it in a new tab, and by reloading the page)
Then the detail page shows the username in the header and the browser tab title "User · <name>"
And on a slow network "Loading user" shows until the content replaces it
And the breadcrumb reads "Users › <name>" with <name> not a link; clicking "Users" opens the
Users list

### USR-DET-07 Detail-route errors show 404

When I open a user detail URL whose id does not exist, is non-numeric (`abc`), or belongs to a
deleted user
Then "404: That page does not exist" is displayed instead of the detail page

### USR-DET-08 A non-superuser cannot open a user detail page

Auth: second-user

Given a second user with no permission on users
When they open an existing user detail URL
Then "403: Access denied" is displayed (users are superuser-only)

## Groups tab

### USR-GRP-03 Add and remove a group

When I open the Groups tab and click "Add Group"
Then the "Add User to Group" modal lists groups, with a disabled checkbox on groups the user
already belongs to
When I select one or more groups and click "Add (n)"
Then the toast `<n> group(s) added to user "<username>"` appears, the modal closes, the groups
are listed in the Groups tab, and the "Groups (n)" count rises by n
When I remove a group
Then the dialog "Remove Group" shows `Are you sure you want to remove user "<username>" from
group "<group>"?`; confirming shows the toast `User "<username>" removed from group "<group>"`,
drops the row and lowers the count by one
And "Add Group" and "Remove" are always enabled here (a user's detail page is superuser-only, and
a superuser may always change a group's members)

### USR-GRP-05 Both sides stay in sync

This is the one representative of user↔group cross-page sync.

| done on                        | then shown on                                  |
| ------------------------------ | ---------------------------------------------- |
| user › Groups › add group G    | G › Users lists the user; Users list Groups +1 |
| user › Groups › remove group G | G › Users no longer lists the user             |

### USR-GRP-07 The Groups tab empty state

Given a user who belongs to no group
When I open their Groups tab
Then "User is not a member of any group" shows with no action button

## Roles tab

### USR-ROL-01 Role assignment rows, filtering, sorting and paging

Seed: a user with more than two pages of role assignments

When I open the Roles tab
Then the column headers are Role, Description, Permissions, Created, actions, and each row shows
the role name (plain text), its Description (or "—"), its Permissions count and a formatted
Created date, sorted by Role ascending
When I filter by Role, and sort by Role, Description and Created
Then the rows narrow and reorder accordingly, on page 1, with the item total matching
And a user with no role assignments shows "No roles assigned to this user"

### USR-ROL-02 Add roles

When I open the Roles tab and click "Add Role"
Then the "Add Role to User" modal lists roles, with a disabled checkbox on roles the user already
holds as a global assignment (an object- or domain-scoped assignment, and an unassigned role,
stay selectable)
When I select roles and click "Add (n)"
Then the toast `<n> role(s) added to user "<username>"` appears, the modal closes, the roles are
listed with a new Created date, and the "Roles (n)" count rises by n

### USR-ROL-03 Remove one assignment of a role assigned twice

Given the user holds role R globally and on one repository
When I remove one of the R rows
Then the toast `Role "<role>" removed from user "<username>"` appears, only that assignment is
gone, and the other R row stays
