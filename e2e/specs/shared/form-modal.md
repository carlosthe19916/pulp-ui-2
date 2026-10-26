---
area: form-modal
---

# Create and edit modals

> **Layering:** the generic modal lifecycle and client-side validation (fields/defaults,
> open/close/reset, validation messages, Enter-submit, double-submit) are **component tests**
> (`client/src/app/**/*Modal.test.tsx`), not e2e. Only the real-backend scenarios remain here:
> FORM-09 (server rejection text), FORM-10 (permission denied) and FORM-12 (success round-trip
> shows the change).

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

## Submitting

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
