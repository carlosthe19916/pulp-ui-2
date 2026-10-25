---
area: form-modal
---

# Create and edit modals

> **Layering:** the generic modal lifecycle and client-side validation (FORM-01..08, FORM-11 —
> fields/defaults, open/close/reset, validation messages, Enter-submit, double-submit) are
> **component tests** (`client/src/app/**/*Modal.test.tsx`), not e2e. Only the real-backend
> scenarios remain here: FORM-09 (server rejection text), FORM-10 (permission denied) and
> FORM-12 (success round-trip shows the change).

Scenarios in this file run once per modal:

A modal opened from a detail page is the same modal as the one opened from the list, so each is
tested once (from the list). FORM-12's "places" column still proves the detail/breadcrumb/title
sync in that single run.

| modal        | opened from                  | title                   | submit |
| ------------ | ---------------------------- | ----------------------- | ------ |
| Create user  | Users › "Create user"        | Create User             | Create |
| Edit user    | Users › row › Edit           | Edit <username>         | Save   |
| Create group | Groups › "Create Group"      | Create Group            | Create |
| Edit group   | Groups › row › Edit          | Edit <name>             | Save   |
| Create role  | Roles › "Create Role"        | Create Role             | Create |
| Edit role    | Roles › unlocked row › Edit  | Edit Role: <name>       | Save   |
| Edit policy  | Access policies › row › Edit | Edit policy "<viewset>" | Save   |

## Opening and closing

### FORM-01 Title and buttons

When I open <modal>
Then the modal title is <title>, with buttons <submit> and "Cancel"

Run for every modal.

### FORM-02 Closing without saving

Given I open <modal> and change a field
When I close it with <how>
Then the modal closes, nothing is saved and no toast appears

| how            |
| -------------- |
| "Cancel"       |
| the × button   |
| the Escape key |

Run every way to close on every modal.

### FORM-03 Reopening starts fresh

Given I open <modal>, change fields, and close it without saving
When I open <modal> again
Then <state>

| modal kind | state                                                 |
| ---------- | ----------------------------------------------------- |
| create     | every field is back to its default and no error shows |
| edit       | every field shows the saved value and no error shows  |

Run for every modal.

### FORM-04 Reopening after a server error starts fresh

Given I submit <modal> and get an in-form error
When I close the modal and open it again
Then the in-form error is gone

Run for every modal.

## Validation

### FORM-05 Validation appears while typing

Given I open <modal>
When I type an invalid value in a validated field
Then its error appears under the field without submitting
When I correct the value
Then the error disappears

| modal        | field      | invalid value   | error                                  |
| ------------ | ---------- | --------------- | -------------------------------------- |
| Create user  | Username   | type then clear | Username is required                   |
| Create user  | Password   | `short`         | Password must be at least 8 characters |
| Create user  | Email      | `not-an-email`  | Invalid email address                  |
| Edit user    | Email      | `not-an-email`  | Invalid email address                  |
| Create group | Name       | type then clear | Name is required                       |
| Edit group   | Name       | clear           | Name is required                       |
| Create role  | Name       | type then clear | Name is required                       |
| Edit policy  | Statements | `[`             | Statements must be valid JSON          |

### FORM-06 Submitting an untouched invalid form

Given I open <modal> without touching any field
When I click <submit>
Then <errors> show and nothing is sent

| modal        | errors                                         |
| ------------ | ---------------------------------------------- |
| Create user  | "Username is required", "Password is required" |
| Create group | "Name is required"                             |
| Create role  | "Name is required"                             |

## Submitting

### FORM-07 Enter submits the form

Given I open <modal> and fill it with valid values
When I press Enter in a text field
Then the form is submitted as if I clicked <submit>

Run for every modal. Exceptions: in the role form's permission input, Enter adds a permission
and does not submit (see [ROL-PERM-01](../roles.md#rol-perm-01-a-permission-that-saves-with-a-server-error)); Edit
policy has only JSON text areas, where Enter adds a line and does not submit.

### FORM-08 The submit button while saving

Given I open <modal> with valid values on a slow network
When I click <submit>
Then the submit button shows a spinner and is disabled until the request finishes
When I click it again while it spins
Then only one record is created or one update is sent

Run for every modal.

### FORM-09 Server rejection shows in the form

Given I open <modal>
When I submit <input> that the server rejects
Then an in-form error shows the server's reason, no toast appears, and the modal stays open
with my values kept

This scenario proves only that the UI **surfaces** a server rejection; the full set of server
reasons per entity is the api contract layer (`*.api.spec.ts`). Keep a few representatives across
a create modal, an edit modal and a non-text field:

| modal       | input                                                      | server reason                                      |
| ----------- | ---------------------------------------------------------- | -------------------------------------------------- |
| Create user | a username that already exists                             | This field must be unique.                         |
| Create role | a permission that does not exist (`core.not_a_permission`) | Permission 'core.not_a_permission' does not exist. |
| Edit role   | a permission that does not exist                           | Permission '<permission>' does not exist.          |

Pulp also accepts some policy values that break the endpoint afterwards; those are in
[ACP-EDT-02](../access-policies.md#acp-edt-02-values-pulp-accepts-but-that-break-the-endpoint).

### FORM-10 Permission denied on submit

Auth: second-user

Given a second user without the permission to <action>
When they submit <modal> with valid values
Then the in-form error title is <fallback> and its text starts with "You do not have
permission to perform this action. Ask an administrator to grant the required role."

| modal        | action        | fallback               |
| ------------ | ------------- | ---------------------- |
| Create user  | add users     | Failed to create user  |
| Create role  | add roles     | Failed to create role  |
| Create group | add groups    | Failed to create group |
| Edit group   | change groups | Failed to update group |

Only these modals are reachable by a non-superuser: users, roles and access policies are
superuser-only, so their lists show "403: Access denied" and no row can be edited, but the
"Create" buttons stay. Edit group is disabled without the permission
([GRP-PERM-01](../groups.md#grp-perm-01-gated-actions-follow-the-users-permission-on-the-group));
reach it by revoking the permission after the page has loaded.

### FORM-11 The error clears on the next submit

Given <modal> shows an in-form error
When I fix the input and submit again
Then the error is gone and the save succeeds

Run for every modal.

### FORM-12 Success

Given I open <modal> with valid values
When I click <submit>
Then the modal closes, the success toast <toast> appears, and the change shows without a
reload in <places>

| modal        | toast                     | places                                |
| ------------ | ------------------------- | ------------------------------------- |
| Create user  | User "<username>" created | Users list                            |
| Edit user    | User "<username>" updated | Users list, user detail               |
| Create group | Group "<name>" created    | Groups list                           |
| Edit group   | Group "<name>" updated    | Groups list                           |
| Create role  | Role "<name>" created     | Roles list, Add Role modals           |
| Edit role    | Role "<name>" updated     | Roles list, user and group Roles tabs |
| Edit policy  | Policy "<viewset>" saved  | Access policies list                  |
