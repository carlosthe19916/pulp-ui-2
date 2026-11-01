---
area: groups
routes: [/admin/groups, /admin/groups/$groupId]
---

# Groups

## List

### GRP-LIST-01 Row content

Summary: The Groups list shows each group name as a link with Edit/Delete row actions, plus a filtered empty state.

When I open Groups from the Administration navigation
Then the heading is "Groups", the Groups nav item is highlighted, the column headers are Name and
actions, and each row shows the group name as a link to its detail page and a row actions menu
with "Edit" and "Delete"
And filtering by a value that matches nothing shows "No results found" with a "Clear all filters"
button that restores the rows

### GRP-LIST-02 A non-superuser sees only groups they may view

Summary: A non-superuser sees only the groups they may view in the list (scoped, not a 403).

Auth: second-user

Given a second user with no admin permissions who may view one group
When they open the Groups list
Then the table lists only the groups they may view (not "403: Access denied" — groups are scoped)

## Permissions

Group actions follow the logged-in user's permissions on each group: a missing permission
disables the action (it stays visible) with a tooltip.

### GRP-PERM-01 Gated actions follow the user's permission on the group

Summary: A group's Edit and Delete follow the logged-in user's per-group permissions, disabled with a tooltip when missing.

Auth: second-user

Given a second user who holds a role on group G (not a global role) granting view plus <change>
and <delete>
When they open the Groups list
Then the row's Edit and Delete follow <state>

| change | delete | Edit                                                          | Delete                                                        |
| ------ | ------ | ------------------------------------------------------------- | ------------------------------------------------------------- |
| no     | no     | disabled, tooltip "You don't have permission to change this." | disabled, tooltip "You don't have permission to delete this." |
| yes    | yes    | enabled                                                       | enabled                                                       |

The detail page's actions and the Users tab's "Add User" / "Remove" use the same gate. When "Add
User" is enabled for a non-superuser, its modal still shows "403: Access denied" because Pulp
lets only superusers list users, so in practice only superusers add members from the UI.

### GRP-PERM-04 Permissions granted through a group or a global role

Summary: Change granted via an object role enables a group's Edit; via a global role it stays disabled (a known UI gap).

Auth: second-user

Given a second user who gets change on groups <how>
Then Pulp lets them change <which groups>, and the gated "change" actions should be enabled for
those groups

| how                    | which groups | UI today                |
| ---------------------- | ------------ | ----------------------- |
| a role on group G only | G only       | enabled for G           |
| a global role          | every group  | disabled on every group |

UI gap: the UI reads `my_permissions/`, which only returns roles held on that group, so a global
role is not seen and the actions stay disabled although Pulp allows them. No endpoint exposes a
non-superuser's global roles, so these rows are expected to fail.

### GRP-PERM-06 The admin sees everything enabled

Summary: The admin (superuser) sees every gated group action enabled, even on a group it holds no role on.

Given the admin (a superuser), who may do anything in Pulp
Then every gated action is enabled, even on a group the admin holds no role on (Pulp's
`my_permissions/` ignores superuser status, so the UI checks it separately)

## Create

### GRP-CRE-03 Create a group

Summary: Creating a group shows a success toast and the new group in the list.

When I click "Create Group", enter a name and submit
Then the modal closes, the toast `Group "<name>" created` appears, and the group is in the Groups
list

### GRP-CRE-04 A duplicate name is rejected in the form

Summary: Submitting Create group with an existing name surfaces the server's rejection in the form.

When I create a group with a name that already exists
Then an in-form error shows the server's reason, no toast appears, and the modal stays open

### GRP-CRE-05 Create is enabled for a non-superuser

Summary: A non-superuser can open Create group, but submitting a valid form fails with a permission-denied error in the form.

Auth: second-user

Given a second user without the global permission to add groups
Then "Create Group" is enabled, and submitting a valid form shows the in-form error title
"Failed to create group" with the text "You do not have permission to perform this action. Ask an
administrator to grant the required role."

## Edit

### GRP-EDT-01 Rename

Summary: Renaming a group updates the list and reflects on a member's Groups tab.

Given user U is in group G
When I rename G from the Groups list and save
Then the toast `Group "<new name>" updated` appears, the new name shows in the Groups list, and
U's Groups tab shows the new name

## Delete

### GRP-DEL-01 Delete from the list

Summary: Deleting a group from the list confirms, spins then toasts, removes the row, and drops its members' memberships.

Given a group with <contents>
When I open "Delete" from the Groups list
Then the dialog "Delete Group" shows `Are you sure you want to delete group "<name>"? This action
cannot be undone.` with a danger "Delete" button
When I confirm on a slow network
Then the button spins until the request finishes, the dialog closes, the toast `Group "<name>"
deleted` appears, the row is gone, and <aftermath>

| contents           | aftermath                                                      |
| ------------------ | -------------------------------------------------------------- |
| no users, no roles | —                                                              |
| two users          | each user's Groups tab no longer lists it, Users list count −1 |

### GRP-DEL-03 A failed delete keeps the dialog open

Summary: Confirming a delete for a group removed elsewhere shows a danger toast and keeps the dialog open.

Given a group that is deleted through the API after I open its delete dialog
When I confirm
Then the danger toast `Failed to delete group "<name>"` appears, the dialog stays open, and the
row is unchanged

### GRP-DEL-04 Deleting from the detail page

Summary: Deleting a group from its detail page returns to the list with no stale request for the gone group.

When I delete a group from its detail page
Then the dialog is the same as from the list, the Groups list opens afterwards, and no request
for the deleted group answers 404

## Detail page

### GRP-DET-01 Header, tabs and counts

Summary: A group's detail page shows the name header, Edit/Delete actions, and Users/Roles tabs with their real counts.

When I open a group's detail page
Then the header shows the group name, an actions menu with "Edit Group" and "Delete Group", and
tabs "Users (n)" and "Roles (n)" with Users selected, where n is the real total (a group with 1
user and 12 role assignments reads "Users (1)" and "Roles (12)" — 12 is above a page, so it
proves totals, not visible rows)

### GRP-DET-04 Opening a group detail page directly

Summary: Opening a group's detail URL directly loads it with the browser tab title and breadcrumb, and 404s for bad ids.

When I open a group's detail URL (new tab, and reload)
Then the detail page shows the group name in the header and the browser tab title "Group · <name>"
And on a slow network "Loading group" shows until the content replaces it
And the breadcrumb reads "Groups › <name>" with <name> not a link; clicking "Groups" opens the list
And a URL whose id does not exist, is non-numeric, or belongs to a deleted group shows "404: That
page does not exist"

### GRP-DET-05 A non-superuser and the group detail URL

Summary: A non-superuser gets a 404 for a group they can't see and the detail page for one they may view.

Auth: second-user

Given a second user with no permission on a group
When they open that group's detail URL
Then "404: That page does not exist" is displayed (a group they can't see does not exist)
When they open the detail URL of a group they may view
Then the detail page opens

## Users tab

### GRP-USR-03 Add and remove users

Summary: On a group's Users tab, adding and removing users updates the list and count and shows the right toasts.

When I open the Users tab and click "Add User"
Then the "Add User to Group" modal lists users, with a disabled checkbox on users already in the
group
When I select users and click "Add (n)"
Then the toast `<n> user(s) added to group "<name>"` appears, the modal closes, the users are
listed in the Users tab, and the "Users (n)" count rises by n
When I remove a user
Then the dialog "Remove User" shows `Are you sure you want to remove user "<username>" from group
"<group>"?`; confirming shows the toast `User "<username>" removed from group "<group>"`, drops the
row and lowers the count by one
And "Add User" and "Remove" follow the same gate as the list actions

### GRP-USR-05 The Add User modal filters, sorts and pages

Summary: The Add User modal filters, sorts and pages its candidate list; the Users tab itself only pages, with username links.

Seed: more than two pages of users

When I open the "Add User" modal
Then its table sorts by Username ascending, filters by Username, sorts by Username and Email, and
pages — the rows narrowing and reordering accordingly
And the Users tab itself only pages (Pulp does not guarantee a group's member order, so a test
must not depend on it); each username links to its user detail page

### GRP-USR-06 Adding a user grants the group's roles

Summary: Adding a user to a group grants them the group's roles (their gated actions enable); removing revokes them.

Auth: second-user

Given group G has a role that lets members change repositories
When I add the second user to G
Then their repository change actions become enabled
When I remove them from G
Then those actions become disabled again

## Roles tab

### GRP-ROL-01 Role assignment rows, add and remove

Summary: On a group's Roles tab, role assignments show their details and can be added and removed with the right toasts.

When I open the Roles tab
Then each row shows the role name, its Description (or "—"), its Permissions count and a formatted
Created date, sorted by Role ascending, and an empty tab shows "No roles assigned to this group"
When I add roles with "Add Role" (the "Add Role to Group" modal, roles already held globally
disabled)
Then the toast `<n> role(s) added to group "<name>"` appears and they are listed with a new
Created date
When I remove a role
Then the dialog "Remove Role" shows `Are you sure you want to remove role "<role>" from group
"<group>"?`; confirming shows the toast `Role "<role>" removed from group "<group>"` and drops the
row

### GRP-ROL-02 A non-superuser who may view a group cannot read its role assignments

Summary: A non-superuser who may view a group still sees “403: Access denied” on its Roles tab and Add Role modal.

Auth: second-user

Given a second user who may view group G but is not a superuser
When they open G's detail page
Then the tab reads "Roles (0)" and the Roles tab table shows "403: Access denied"
And "Add Role" is enabled, but its modal table shows "403: Access denied" too
