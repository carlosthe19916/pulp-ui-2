---
area: confirm-dialog
---

# Confirmation dialogs

Scenarios in this file run once per dialog:

| dialog                 | opened from                                           | title               | body                                                                             | confirm | style   |
| ---------------------- | ----------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------- | ------- | ------- |
| Delete user (list)     | Users › row › Delete                                  | Delete User         | Are you sure you want to delete "<username>"? This action cannot be undone.      | Delete  | danger  |
| Delete user (detail)   | user detail › actions › "Delete User"                 | Delete User         | Are you sure you want to delete "<username>"? This action cannot be undone.      | Delete  | danger  |
| Delete group (list)    | Groups › row › Delete                                 | Delete Group        | Are you sure you want to delete group "<name>"? This action cannot be undone.    | Delete  | danger  |
| Delete group (detail)  | group detail › actions › "Delete Group"               | Delete Group        | Are you sure you want to delete group "<name>"? This action cannot be undone.    | Delete  | danger  |
| Delete role            | Roles › unlocked row › Delete                         | Delete Role         | Are you sure you want to delete the role "<name>"? This action cannot be undone. | Delete  | danger  |
| Remove group from user | user detail › Groups › row › Remove                   | Remove Group        | Are you sure you want to remove user "<username>" from group "<group>"?          | Remove  | primary |
| Remove user from group | group detail › Users › row › Remove                   | Remove User         | Are you sure you want to remove user "<username>" from group "<group>"?          | Remove  | primary |
| Remove role from user  | user detail › Roles › row › Remove                    | Remove Role         | Are you sure you want to remove role "<role>" from user "<username>"?            | Remove  | primary |
| Remove role from group | group detail › Roles › row › Remove                   | Remove Role         | Are you sure you want to remove role "<role>" from group "<group>"?              | Remove  | primary |
| Reset policy           | Access policies › customized row › "Reset to default" | Reset access policy | Restore "<viewset>" to its default? Your changes to it are lost.                 | Reset   | primary |

## Scenarios

### CONF-01 Content

When I open <dialog>
Then the title is <title>, the body is <body> with the real names filled in, and the buttons
are <confirm> (styled <style>) and "Cancel"

Run for every dialog.

### CONF-02 Dismissing

Given I open <dialog>
When I dismiss it with <how>
Then the dialog closes, nothing changes and no toast appears

| how            |
| -------------- |
| "Cancel"       |
| the × button   |
| the Escape key |

Run every way on every dialog.

### CONF-03 Confirming

Given I open <dialog> on a slow network
When I click <confirm>
Then the button shows a spinner until the request finishes
And then <result>

| dialog                 | result                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Delete user (list)     | the dialog closes, toast `User "<username>" deleted`, the row is gone                                                           |
| Delete user (detail)   | toast `User "<username>" deleted`, the Users list opens without the user                                                        |
| Delete group (list)    | the dialog closes, toast `Group "<name>" deleted`, the row is gone                                                              |
| Delete group (detail)  | toast `Group "<name>" deleted`, the Groups list opens without the group                                                         |
| Delete role            | the dialog closes, toast `Role "<name>" deleted`, the row is gone                                                               |
| Remove group from user | the dialog closes, toast `User "<username>" removed from group "<group>"`, the row is gone, the "Groups (n)" count drops by one |
| Remove user from group | the dialog closes, toast `User "<username>" removed from group "<group>"`, the row is gone, the "Users (n)" count drops by one  |
| Remove role from user  | the dialog closes, toast `Role "<role>" removed from user "<username>"`, the row is gone, the "Roles (n)" count drops by one    |
| Remove role from group | the dialog closes, toast `Role "<role>" removed from group "<group>"`, the row is gone, the "Roles (n)" count drops by one      |
| Reset policy           | the dialog closes, toast `Policy "<viewset>" reset to its default`, the row's Status is Default                                 |

### CONF-04 Failure keeps the dialog open

Given <trigger>
When I confirm <dialog>
Then a danger toast <fallback> appears with the server's reason, the dialog stays open, and
the row is unchanged
When the cause is removed and I click <confirm> again (permission rows only; an object
deleted elsewhere stays gone)
Then the action succeeds as in [CONF-03](#conf-03-confirming)

| dialog                 | trigger                                                          | fallback                                                |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| Delete user (list)     | the user was deleted elsewhere                                   | Failed to delete user "<username>"                      |
| Delete user (detail)   | the user was deleted elsewhere                                   | Failed to delete user "<username>"                      |
| Delete group (list)    | a second user whose delete permission is revoked after page load | Failed to delete group "<name>"                         |
| Delete group (detail)  | a second user whose delete permission is revoked after page load | Failed to delete group "<name>"                         |
| Delete role            | the role was deleted elsewhere                                   | Failed to delete role "<name>"                          |
| Remove group from user | the group was deleted elsewhere                                  | Failed to remove user "<username>" from group "<group>" |
| Remove user from group | a second user whose change permission is revoked after page load | Failed to remove user "<username>" from group "<group>" |
| Remove role from user  | the assignment was removed elsewhere                             | Failed to remove role "<role>"                          |
| Remove role from group | the assignment was removed elsewhere                             | Failed to remove role "<role>"                          |

The group rows need `Auth: second-user`. The other dialogs are superuser-only in Pulp, so a
permission failure can't happen there. Reset policy has no realistic failure
([ACP-RST-03](../access-policies.md#acp-rst-03-a-failed-reset)).

### CONF-05 The object was already gone

Given I open <dialog>
And <change> happens through the API before I confirm
When I click <confirm>
Then <outcome>

| dialog                 | change                                     | outcome                                                                     |
| ---------------------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| Delete user            | the user is deleted                        | danger toast with the server's "not found" reason; the dialog stays open    |
| Delete group           | the group is deleted                       | danger toast with the server's "not found" reason; the dialog stays open    |
| Delete role            | the role is deleted                        | danger toast with the server's "not found" reason; the dialog stays open    |
| Remove group from user | the group is deleted                       | danger toast with the server's "not found" reason; the dialog stays open    |
| Remove user from group | the user is removed from the group already | success toast as in [CONF-03](#conf-03-confirming) (Pulp treats it as done) |
| Remove user from group | the user is deleted                        | danger toast with the server's "not found" reason; the dialog stays open    |
| Remove role from user  | the assignment is removed                  | danger toast with the server's "not found" reason; the dialog stays open    |
| Remove role from group | the assignment is removed                  | danger toast with the server's "not found" reason; the dialog stays open    |

### CONF-06 No stale requests after deleting from a detail page

When I confirm <dialog>
Then the list opens and no request for the deleted object answers 404 afterwards

| dialog                |
| --------------------- |
| Delete user (detail)  |
| Delete group (detail) |
