---
area: navigation
routes:
  [
    /admin/users,
    /admin/users/$userId,
    /admin/groups,
    /admin/groups/$groupId,
    /admin/roles,
    /admin/access-policies,
  ]
---

# Administration navigation

## Navigation menu

### NAV-01 The Administration group links every admin page

Given I am logged in as the admin
When I expand "Administration" in the side navigation and click <item>
Then the page with heading <heading> opens at <path>
And <item> is the highlighted navigation item

| item            | heading         | path                   |
| --------------- | --------------- | ---------------------- |
| Users           | Users           | /admin/users           |
| Groups          | Groups          | /admin/groups          |
| Roles           | Roles           | /admin/roles           |
| Access policies | Access policies | /admin/access-policies |

### NAV-02 Detail pages keep their parent item highlighted

Given I am on <page>
Then "Administration" is expanded and <item> is the highlighted navigation item

| page                  | item   |
| --------------------- | ------ |
| a user's detail page  | Users  |
| a group's detail page | Groups |

## Titles and breadcrumbs

### NAV-03 Each page sets the browser tab title

When I open <page>
Then the browser tab title contains <title>

| page                   | title           |
| ---------------------- | --------------- |
| Users list             | Users           |
| Groups list            | Groups          |
| Roles list             | Roles           |
| Access policies list   | Access policies |
| user detail of "alice" | User · alice    |
| group detail of "ops"  | Group · ops     |

### NAV-04 The detail breadcrumb returns to its list

Given I am on <detail> of <name>
Then the breadcrumb shows <list> › <name>, with <name> not a link
When I click <list> in the breadcrumb
Then the <list> list opens

| detail       | list   |
| ------------ | ------ |
| user detail  | Users  |
| group detail | Groups |

## Direct URLs and errors

### NAV-05 A detail URL opens directly

When I open the detail URL of an existing <kind> <how>
Then the detail page shows its name in the header

Main cases (each kind once, via new tab and via reload):

| kind  | how                            |
| ----- | ------------------------------ |
| user  | by typing the URL in a new tab |
| group | by reloading the detail page   |

### NAV-06 A detail page shows a loading state, then the content

When I open a <kind> detail URL on a slow network
Then "<label>" is shown until the page content replaces it

| kind  | label         |
| ----- | ------------- |
| user  | Loading user  |
| group | Loading group |

### NAV-07 Detail-route error states

When I open the <kind> detail URL with <id>
Then <shown> is displayed instead of the detail page

| kind  | id                        | shown                           |
| ----- | ------------------------- | ------------------------------- |
| user  | an id that does not exist | "404: That page does not exist" |
| user  | a non-numeric id (`abc`)  | "404: That page does not exist" |
| user  | an id of a deleted user   | "404: That page does not exist" |
| group | an id that does not exist | "404: That page does not exist" |
| group | a non-numeric id (`abc`)  | "404: That page does not exist" |
| group | an id of a deleted group  | "404: That page does not exist" |

### NAV-08 Detail pages without view permission

Auth: second-user

Given a second user with no permissions on <kind>s
When they open an existing <kind> detail URL
Then <shown> is displayed

| kind  | shown                           | why                                                          |
| ----- | ------------------------------- | ------------------------------------------------------------ |
| user  | "403: Access denied"            | users are superuser-only                                     |
| group | "404: That page does not exist" | groups are scoped: a group the user can't see does not exist |

### NAV-09 Lists without view permission

Auth: second-user

Given a second user with no admin permissions
When they open <page>
Then <outcome>

| page            | outcome                                                  |
| --------------- | -------------------------------------------------------- |
| Users           | the table shows "403: Access denied" (superuser-only)    |
| Groups          | the table is empty: only groups they may view are listed |
| Roles           | the table shows "403: Access denied" (superuser-only)    |
| Access policies | the table shows "403: Access denied" (superuser-only)    |

Staff status does not change this: Pulp only lets superusers manage users, roles and access
policies.

### NAV-10 Server error on a detail page

Manual

When the server fails while loading a <kind> detail page
Then "Unable to load resource" with "Something went wrong while loading this page. Try
again later." is displayed

| kind  |
| ----- |
| user  |
| group |
