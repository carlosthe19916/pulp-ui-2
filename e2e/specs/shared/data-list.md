---
area: data-list
---

# Data lists (every admin table)

> **Layering:** the full filter/sort/paging suite (LIST-01..19) runs against **one reference
> table per shape** — **Users** (main list), **User roles** (detail tab) and **Select users**
> (select modal). Every other table gets a single **LIST-SMOKE** check that it wires the shared
> table up (right columns, and its filter/sort work). So a table's row below is exercised in
> full only on its reference; elsewhere it is smoke-covered.

Every table below is server-paged, server-sorted and server-filtered. Scenarios in this file
run once per applicable table; the tables are:

| table                | where                                    | text filter | other filter | sortable columns (default first) | page size |
| -------------------- | ---------------------------------------- | ----------- | ------------ | -------------------------------- | --------- |
| Users                | Users page                               | Username    | —            | Username, Date Joined            | 10        |
| Groups               | Groups page                              | Name        | —            | Name                             | 10        |
| Roles                | Roles page                               | Name        | Locked       | Name, Locked                     | 10        |
| Access policies      | Access policies page                     | Viewset     | —            | Viewset, Status                  | 20        |
| User groups          | user detail › Groups tab                 | Name        | —            | Name                             | 10        |
| User roles           | user detail › Roles tab                  | Role        | —            | Role, Description, Created       | 10        |
| Group users          | group detail › Users tab                 | —           | —            | —                                | 10        |
| Group roles          | group detail › Roles tab                 | Role        | —            | Role, Description, Created       | 10        |
| Select groups        | user detail › Groups › "Add Group" modal | Name        | —            | Name                             | 10        |
| Select users         | group detail › Users › "Add User" modal  | Username    | —            | Username, Email                  | 10        |
| Select roles (user)  | user detail › Roles › "Add Role" modal   | Role        | —            | Role, Description                | 10        |
| Select roles (group) | group detail › Roles › "Add Role" modal  | Role        | —            | Role, Description                | 10        |

The page-size choices offered are 10 and 20.

Group users is paged only: Pulp ignores ordering and filters on a group's members and does not
guarantee their order, so the same member could move between pages.

## Columns

### LIST-01 Column headers

When I open <table>
Then the column headers are, in order, <columns>

| table                | columns                                                   |
| -------------------- | --------------------------------------------------------- |
| Users                | Username, Email, Active, Groups, Date Joined, (actions)   |
| Groups               | Name, (actions)                                           |
| Roles                | Name, Plugin, Description, Permissions, Locked, (actions) |
| Access policies      | Viewset, Statements, Status, (actions)                    |
| User groups          | Name, (actions)                                           |
| User roles           | Role, Description, Permissions, Created, (actions)        |
| Group users          | Username, (actions)                                       |
| Group roles          | Role, Description, Permissions, Created, (actions)        |
| Select groups        | (select), Name                                            |
| Select users         | (select), Username, Email, Name                           |
| Select roles (user)  | (select), Role, Description, Permissions                  |
| Select roles (group) | (select), Role, Description, Permissions                  |

### LIST-02 Links in rows

When I click <cell> in a row of <table>
Then <destination> opens

| table       | cell     | destination              |
| ----------- | -------- | ------------------------ |
| Users       | username | that user's detail page  |
| Groups      | name     | that group's detail page |
| User groups | name     | that group's detail page |
| Group users | username | that user's detail page  |

And these cells are plain text, not links: Roles › Name, Access policies › Viewset, User
roles › Role, Group roles › Role, every cell of the Select tables.

## Sorting

### LIST-03 Default sort

Seed: at least 3 rows whose names sort differently from their creation order

When I open <table>
Then the rows are sorted by <column> ascending and that header shows the ascending marker

| table                | column   |
| -------------------- | -------- |
| Users                | Username |
| Groups               | Name     |
| Roles                | Name     |
| Access policies      | Viewset  |
| User groups          | Name     |
| User roles           | Role     |
| Group roles          | Role     |
| Select groups        | Name     |
| Select users         | Username |
| Select roles (user)  | Role     |
| Select roles (group) | Role     |

### LIST-04 Every sortable column, every direction

Seed: at least 3 rows with distinct values in <column>

Given <table> is open
When I click the <column> header <clicks> time(s)
Then the rows are sorted by <column> <direction>

| table                | column      | clicks | direction                            |
| -------------------- | ----------- | ------ | ------------------------------------ |
| Users                | Username    | 1      | descending (it is already ascending) |
| Users                | Username    | 2      | ascending                            |
| Users                | Date Joined | 1      | ascending                            |
| Users                | Date Joined | 2      | descending                           |
| Groups               | Name        | 1      | descending                           |
| Groups               | Name        | 2      | ascending                            |
| Roles                | Name        | 1      | descending                           |
| Roles                | Name        | 2      | ascending                            |
| Roles                | Locked      | 1      | ascending (unlocked first)           |
| Roles                | Locked      | 2      | descending (locked first)            |
| Access policies      | Viewset     | 1      | descending                           |
| Access policies      | Viewset     | 2      | ascending                            |
| Access policies      | Status      | 1      | ascending (Default first)            |
| Access policies      | Status      | 2      | descending (Customized first)        |
| User groups          | Name        | 1      | descending                           |
| User groups          | Name        | 2      | ascending                            |
| User roles           | Role        | 1      | descending                           |
| User roles           | Role        | 2      | ascending                            |
| User roles           | Description | 1      | ascending                            |
| User roles           | Description | 2      | descending                           |
| User roles           | Created     | 1      | ascending (oldest first)             |
| User roles           | Created     | 2      | descending (newest first)            |
| Group roles          | Role        | 1      | descending                           |
| Group roles          | Role        | 2      | ascending                            |
| Group roles          | Description | 1      | ascending                            |
| Group roles          | Description | 2      | descending                           |
| Group roles          | Created     | 1      | ascending                            |
| Group roles          | Created     | 2      | descending                           |
| Select groups        | Name        | 1      | descending                           |
| Select groups        | Name        | 2      | ascending                            |
| Select users         | Username    | 1      | descending                           |
| Select users         | Username    | 2      | ascending                            |
| Select users         | Email       | 1      | ascending                            |
| Select users         | Email       | 2      | descending                           |
| Select roles (user)  | Role        | 1      | descending                           |
| Select roles (user)  | Role        | 2      | ascending                            |
| Select roles (user)  | Description | 1      | ascending                            |
| Select roles (user)  | Description | 2      | descending                           |
| Select roles (group) | Role        | 1      | descending                           |
| Select roles (group) | Role        | 2      | ascending                            |
| Select roles (group) | Description | 1      | ascending                            |
| Select roles (group) | Description | 2      | descending                           |

### LIST-05 Non-sortable columns

When I open <table>
Then <columns> show no sort control

| table                | columns                          |
| -------------------- | -------------------------------- |
| Users                | Email, Active, Groups            |
| Roles                | Plugin, Description, Permissions |
| Access policies      | Statements                       |
| User roles           | Permissions                      |
| Group users          | Username (no column is sortable) |
| Group roles          | Permissions                      |
| Select users         | Name                             |
| Select roles (user)  | Permissions                      |
| Select roles (group) | Permissions                      |

### LIST-06 Changing the sort returns to page 1

Seed: more rows than one page

Given <table> is on page 2
When I change the sort on any sortable column
Then page 1 is shown

Applies to every table with a sortable column (all except Group users).

## Text filter

### LIST-07 Text filter equivalence classes

Seed: rows named so that each class has a known answer

Given <table> is open
When I type <input> in the <filter> filter
Then <outcome>

Run each row for every table with a text filter (Users, Groups, Roles, Access policies, User
groups, User roles, Group roles, Select groups, Select users, Select roles (user), Select roles
(group)).

| input                                  | outcome                                                             |
| -------------------------------------- | ------------------------------------------------------------------- |
| the full value of one row              | that row is listed                                                  |
| a substring from the middle of a value | every row containing it is listed                                   |
| the value in different letter case     | the same rows as the exact case (case-insensitive)                  |
| a value that matches nothing           | the filtered empty state ([LIST-12](#list-12-filtered-empty-state)) |
| `%`                                    | only rows containing a literal `%` (none, unless seeded)            |
| `_`                                    | only rows containing a literal `_`                                  |
| unicode (`ñ`, `日本`)                  | only rows containing it                                             |
| a value with leading/trailing spaces   | the same rows as without the spaces (Pulp trims the filter)         |
| a single character                     | every row containing it                                             |

### LIST-08 The filter waits for typing to stop

Given <table> is open
When I type a value one character at a time
Then the rows update once after I stop typing, not after every character

Applies to every table with a text filter.

### LIST-09 Changing a filter returns to page 1

Seed: more rows than one page, several of which match the filter

Given <table> is on page 2
When I type in the filter
Then page 1 of the filtered rows is shown

Applies to every table with a text filter, and to the Roles › Locked filter.

### LIST-10 Removing the filter

Given <table> has a text filter applied
When I <action>
Then the filter is cleared and the unfiltered rows are back

| action                                |
| ------------------------------------- |
| remove the filter chip                |
| click "Clear filters" in the toolbar  |
| delete the text from the filter input |

Run each action for every table with a text filter.

## Empty and other body states

### LIST-11 Unfiltered empty state

Given <table> has no rows
Then the table shows <title> and no action button

| table       | title                             | how to reach it |
| ----------- | --------------------------------- | --------------- |
| User groups | User is not a member of any group | a new user      |
| User roles  | No roles assigned to this user    | a new user      |
| Group users | No users in this group            | a new group     |
| Group roles | No roles assigned to this group   | a new group     |

The main lists (Users, Groups, Roles, Access policies) and Select tables are never empty
without a filter on a working backend, so their unfiltered titles ("No users found", "No
groups found", "No roles found", "No access policies found") are only reachable through the
filter and are covered by [LIST-12](#list-12-filtered-empty-state).

### LIST-12 Filtered empty state

Given <table> is open
When I filter by a value that matches nothing
Then the table shows <title>, the text "No results match the current filter. Try adjusting or
clearing your filters." and a "Clear all filters" button
When I click "Clear all filters"
Then the filter is cleared and the rows are back

| table                | title                      |
| -------------------- | -------------------------- |
| Users                | No results found           |
| Groups               | No results found           |
| Roles                | No results found           |
| Access policies      | No results found           |
| User groups          | No groups match the filter |
| User roles           | No roles match the filter  |
| Group roles          | No roles match the filter  |
| Select groups        | No results found           |
| Select users         | No results found           |
| Select roles (user)  | No results found           |
| Select roles (group) | No results found           |

### LIST-13 Loading state

When I open <table> on a slow network
Then skeleton rows are shown until the real rows replace them

Applies to every table.

### LIST-14 Server error state

Manual

When the server fails while loading <table>
Then the table shows "Unable to load data" and "Something went wrong while loading this
table."

Applies to every table.

### LIST-20 Tables a non-superuser cannot read

Auth: second-user

Given a second user who is not a superuser
When they reach <table>
Then the table shows "403: Access denied" instead of rows

| table                | reached through                              |
| -------------------- | -------------------------------------------- |
| Group roles          | a group they may view › Roles tab            |
| Select users         | a group they may change › Users › "Add User" |
| Select roles (group) | a group they may view › Roles › "Add Role"   |

Pulp lets only superusers list users, roles and role assignments. Users, Roles, Access
policies and the user detail tables are covered by NAV.

## Pagination

### LIST-15 Paging controls

Seed: more than two pages of rows in <table> (for example 25 rows for a 10-row table)

Given <table> is open on page 1
When I <action>
Then <outcome>

| action                               | outcome                                         |
| ------------------------------------ | ----------------------------------------------- |
| click next page                      | page 2 is shown, with different rows            |
| click previous page from page 2      | page 1 is shown                                 |
| click last page                      | the last page is shown, with the remaining rows |
| click first page from the last page  | page 1 is shown                                 |
| type a page number in the page input | that page is shown                              |

Run every action on every table. The top and bottom paginators show the same page and item
range after each action, and both can perform each action.

### LIST-16 Page size

Seed: more than 20 rows in <table>

Given <table> is open
When I choose <size> per page
Then <size> rows are shown, the item range reads 1 - <size>, and page 1 is shown

| size |
| ---- |
| 10   |
| 20   |

Run each size on every table. Access policies starts at 20; all others start at 10.

### LIST-17 Item count

Given <table> has N matching rows
Then the paginator shows a total of N
And after a filter, the total equals the filtered count

Applies to every table.

### LIST-18 Filter, sort and page combined

Seed: more than one page of rows that match a filter

Given <table> is open
When I apply the steps in the order <order>
Then the same rows are shown in the same order, on page 1

| order                           |
| ------------------------------- |
| filter, then sort descending    |
| sort descending, then filter    |
| go to page 2, filter, then sort |
| go to page 2, sort, then filter |

Run each order on every table that has both a text filter and a sortable column.

### LIST-19 Removing the last row on a page

Seed: exactly 11 rows (one on page 2)

Given <table> is on page 2 showing its only row
When I delete or remove that row
Then Open: decide whether the list moves to page 1 or shows an empty page 2

| table       |
| ----------- |
| Users       |
| Groups      |
| Roles       |
| User groups |
| User roles  |
| Group users |
| Group roles |
