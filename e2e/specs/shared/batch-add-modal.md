---
area: batch-add-modal
---

# Multi-select "Add" modals

Scenarios in this file run once per modal:

| modal             | opened from                        | title             | item  | target            | not selectable                                     |
| ----------------- | ---------------------------------- | ----------------- | ----- | ----------------- | -------------------------------------------------- |
| Add group to user | user detail › Groups › "Add Group" | Add User to Group | group | user "<username>" | groups the user already belongs to                 |
| Add user to group | group detail › Users › "Add User"  | Add User to Group | user  | group "<name>"    | users already in the group                         |
| Add role to user  | user detail › Roles › "Add Role"   | Add Role to User  | role  | user "<username>" | roles the user already has as a global assignment  |
| Add role to group | group detail › Roles › "Add Role"  | Add Role to Group | role  | group "<name>"    | roles the group already has as a global assignment |

Filter, sort, paging and empty states of the tables inside these modals are covered by
[data-list.md](data-list.md) (Select groups, Select users, Select roles).

## Selection

### BATCH-01 The Add button follows the selection

Given I open <modal>
When I select <n> selectable rows
Then the Add button reads <label> and is <state>

| n                     | label                | state    |
| --------------------- | -------------------- | -------- |
| 0                     | Add                  | disabled |
| 1                     | Add (1)              | enabled  |
| 2                     | Add (2)              | enabled  |
| every row on the page | Add (<rows on page>) | enabled  |
| 1, then deselect it   | Add                  | disabled |

Run every row on every modal.

### BATCH-02 Selection spans pages

Seed: more than one page of selectable rows

Given I open <modal> and select one row on page 1
When I go to page 2 and select one row there
Then the button reads "Add (2)"
When I go back to page 1
Then the first row is still selected

Run for every modal.

### BATCH-03 Selection survives filtering and sorting

Given I open <modal> and select a row
When I <change>
Then the button still reads "Add (1)" and, when the row is visible again, it is still selected

| change                               |
| ------------------------------------ |
| filter so the selected row is hidden |
| clear the filter                     |
| change the sort                      |
| change the page size                 |

Run every change on every modal.

### BATCH-04 Rows that cannot be selected

Seed: the owner already has one <item> (and, for paging, it sits on page 2)

Given I open <modal>
Then the row of the existing <item> has a disabled checkbox
And it is disabled on whatever page, filter or sort it appears
When I use "select page"
Then every row except the disabled one is selected

Run for every modal.

### BATCH-05 Role assignments that do or do not block a row

Given the <owner> has role R assigned <scope>
When I open "Add role to <owner>"
Then the row for R is <state>

| owner | scope                                         | state          |
| ----- | --------------------------------------------- | -------------- |
| user  | globally                                      | not selectable |
| user  | only on one object (for example a repository) | selectable     |
| user  | only in one domain (Requires: domains)        | selectable     |
| user  | globally and on one object                    | not selectable |
| user  | not at all                                    | selectable     |
| group | globally                                      | not selectable |
| group | only on one object                            | selectable     |
| group | only in one domain (Requires: domains)        | selectable     |
| group | globally and on one object                    | not selectable |
| group | not at all                                    | selectable     |

And adding a selectable R creates a global assignment, shown as a new row in the Roles tab
next to any object-scoped one.

Seed note: Pulp only allows an object-scoped assignment when R carries a permission on that
object's type (for example `file.filerepository_viewer` on a file repository), and a
domain-scoped one when R carries a permission on a model that belongs to a domain.

### BATCH-06 Membership through another route does not block

Given user U is in group G1 but not group G2
When I open "Add group to user" for U
Then G1 is not selectable and G2 is selectable
When I open "Add user to group" for G2
Then U is selectable

## Results

### BATCH-07 Every outcome of an add

Given I open <modal> and select <selection>
When I click "Add (n)"
Then the toasts are <toasts> and the modal <closes>

| selection             | toasts                                                                                                                      | closes                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1 row, which succeeds | success "1 <item> added to <target>"                                                                                        | closes                             |
| 2 rows, both succeed  | success "2 <item>s added to <target>"                                                                                       | closes                             |
| 2 rows, one fails     | success "1 <item> added to <target>" and danger "Failed to add 1 <item> to <target>: <name>" with the server reason         | closes                             |
| 3 rows, two fail      | success "1 <item> added to <target>" and danger "Failed to add 2 <item>s to <target>: <name>, <name>" with the first reason | closes                             |
| 1 row, which fails    | danger "Failed to add 1 <item> to <target>: <name>" only                                                                    | stays open with the selection kept |
| 2 rows, both fail     | danger "Failed to add 2 <item>s to <target>: <name>, <name>" only                                                           | stays open with the selection kept |

Run every row on every modal. Make a row fail by changing it through the API after the modal
shows it:

| modal             | change                                    | server reason                               |
| ----------------- | ----------------------------------------- | ------------------------------------------- |
| Add group to user | delete the group                          | No Group matches the given query.           |
| Add user to group | delete the user                           | Could not find user <username>              |
| Add role to user  | assign the same role to the user already  | The role is already assigned to this user.  |
| Add role to group | assign the same role to the group already | The role is already assigned to this group. |

Adding a user who is already in the group is not a failure: Pulp accepts it and changes
nothing.

### BATCH-08 The Add button while saving

Given I select rows on a slow network
When I click "Add (n)"
Then the button shows a spinner and is disabled until every request finishes

Run for every modal.

### BATCH-09 Retry after a full failure

Given an add failed for every row and the modal stayed open
When I fix the cause and click "Add (n)" again
Then the add succeeds and the modal closes

Run for every modal.

### BATCH-10 The owner page updates after adding

When an add succeeds for k rows
Then without a reload the owner's tab shows the new rows and its count rises by k

| modal             | tab and count |
| ----------------- | ------------- |
| Add group to user | "Groups (n)"  |
| Add user to group | "Users (n)"   |
| Add role to user  | "Roles (n)"   |
| Add role to group | "Roles (n)"   |

## Dismissing

### BATCH-11 Closing discards the selection

Given I open <modal>, filter, sort, go to page 2 and select rows
When I close it with <how>
Then nothing is added and no toast appears
When I open <modal> again
Then nothing is selected, the filter is empty, the sort is the default and page 1 is shown

| how            |
| -------------- |
| "Cancel"       |
| the × button   |
| the Escape key |

Run every way on every modal.
