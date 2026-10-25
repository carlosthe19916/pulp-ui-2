---
area: access-policies
routes: [/admin/access-policies]
---

# Access policies

Shared behaviour that also applies here:

- Table filter, sort, paging, empty states: [data-list.md](shared/data-list.md) — Access
  policies.
- Edit modal lifecycle: [form-modal.md](shared/form-modal.md) — Edit policy.
- Reset dialog: [confirm-dialog.md](shared/confirm-dialog.md) — Reset policy.

Every scenario that edits or resets a policy changes server-wide behaviour: it is `Serial`
and must restore the policy to its default afterwards, even when it fails.

## List

### ACP-LIST-01 Page content

When I open Access policies
Then the heading is "Access policies" with the text "Each policy decides who may call one API
endpoint. Changing them is advanced; reset a policy to restore its plugin's default."
And the table shows 20 rows per page
And there is no create button and no delete action

### ACP-LIST-02 Row content

Serial

Given a policy that is <status> with <n> statements
When I find it in the list
Then the row shows its viewset name (plain text), Statements <n>, Status <label>, and row
actions "Edit" and "Reset to default"

| status     | n   | label      |
| ---------- | --- | ---------- |
| default    | ≥1  | Default    |
| customized | 1   | Customized |
| customized | 3   | Customized |

### ACP-LIST-03 Status sort puts customized policies together

Serial

Given one policy is customized
When I sort by Status <direction>
Then the customized policy is <position>

| direction  | position                    |
| ---------- | --------------------------- |
| ascending  | after every default policy  |
| descending | before every default policy |

## Edit

### ACP-EDT-01 Form

When I click Edit on a policy
Then the modal "Edit policy "<viewset>"" shows:

- Statements (required), filled with the saved statements as indented JSON, help text "The
  list of allow/deny statements evaluated for each request."
- Creation hooks, filled with the saved hooks as JSON (or empty), help text "Roles granted
  when an object of this viewset is created."
- Queryset scoping, filled with the saved scoping as JSON (or empty), help text "How lists
  are narrowed to what the user may see."

### ACP-EDT-02 JSON validation for every field

Serial

When I set <field> to <value> and click "Save"
Then <outcome>

| field            | value                                       | outcome                                                                                  |
| ---------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Statements       | (empty)                                     | "Statements is required"; nothing is sent                                                |
| Statements       | `[`                                         | "Statements must be valid JSON"; nothing is sent                                         |
| Statements       | `{}` (valid JSON, not a list)               | in-form error `Expected a list of items but got type "dict".`                            |
| Statements       | `["x"]` (an item that is not an object)     | in-form error `Expected a dictionary of items but got type "str".`                       |
| Statements       | the saved value, unchanged                  | saved ([ACP-EDT-03](#acp-edt-03-a-successful-save))                                      |
| Statements       | one valid allow statement                   | saved ([ACP-EDT-03](#acp-edt-03-a-successful-save))                                      |
| Statements       | `[]`                                        | ⚠ saved; afterwards everyone, admin included, gets "403: Access denied" on that endpoint |
| Statements       | a statement with an unknown condition       | ⚠ saved; afterwards requests to that endpoint fail with a server error                   |
| Statements       | a statement without `principal` or `action` | ⚠ saved; afterwards requests to that endpoint fail with a server error                   |
| Creation hooks   | (empty)                                     | saved; the old hooks are kept ([ACP-EDT-05](#acp-edt-05-clearing-an-optional-field))     |
| Creation hooks   | `[`                                         | "Creation hooks must be valid JSON"; nothing is sent                                     |
| Creation hooks   | `[]`                                        | saved; the policy has no creation hooks                                                  |
| Creation hooks   | `{}` (not a list)                           | in-form error `Expected a list of items but got type "dict".`                            |
| Queryset scoping | (empty)                                     | saved; the old scoping is kept ([ACP-EDT-05](#acp-edt-05-clearing-an-optional-field))    |
| Queryset scoping | `[`                                         | "Queryset scoping must be valid JSON"; nothing is sent                                   |
| Queryset scoping | `{}`                                        | ⚠ saved; afterwards the endpoint's list fails with a server error                        |
| Queryset scoping | `{"function": "not_a_function"}`            | ⚠ saved; afterwards the endpoint's list fails with a server error                        |

⚠ Pulp accepts these values without checking them, and the damage only shows on the endpoint
the policy guards. Use a viewset nothing else in the run needs, and reset it right after.

### ACP-EDT-03 A successful save

Serial

Given a policy with Status Default
When I change its statements to a valid list of <k> statements and save
Then the toast `Policy "<viewset>" saved` appears, the modal closes, the row's Status is
Customized and Statements is <k>
And "Reset to default" becomes enabled

| k   |
| --- |
| 1   |
| 3   |

### ACP-EDT-04 Several invalid fields at once

When Statements and Creation hooks are both invalid JSON
Then both errors show at the same time

### ACP-EDT-05 Clearing an optional field

Serial

Given a policy with saved Creation hooks or Queryset scoping
When I clear <field> and save
Then <outcome>

| field            | outcome                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| Creation hooks   | the old hooks are kept; typing `[]` instead removes them                         |
| Queryset scoping | the old scoping is kept; only "Reset to default" can restore the default scoping |

Pulp refuses an empty (null) value for both fields, so leaving the box empty keeps the saved
value.

### ACP-EDT-06 The server error clears on close

Serial

Given an in-form error from the server
When I close the modal and open Edit again
Then the error is gone

### ACP-EDT-07 Editing an already customized policy

Serial

Given a <status> policy
When I open Edit and save <change>
Then Status is Customized and the statements shown are the ones saved

| status     | change          |
| ---------- | --------------- |
| customized | new statements  |
| customized | nothing changed |
| default    | nothing changed |

Pulp marks a policy Customized on every save, even when nothing changed.

## Reset

### ACP-RST-01 Reset is only offered for customized policies

When I open the row actions of a <status> policy
Then "Reset to default" is <state>

| status     | state                                    |
| ---------- | ---------------------------------------- |
| default    | disabled, tooltip "Already the default." |
| customized | enabled                                  |

Serial (for the customized row)

### ACP-RST-02 Reset restores the default

Serial

Given a customized policy whose statements, creation hooks and queryset scoping I changed
When I reset it ([CONF-03](shared/confirm-dialog.md#conf-03-confirming))
Then the toast `Policy "<viewset>" reset to its default` appears, Status is Default, the
Statements count is back to the default, and Edit shows the default values for all three
fields
And "Reset to default" is disabled again

### ACP-RST-03 A failed reset

Manual

Given a customized policy whose plugin is no longer installed
When I confirm the reset
Then the danger toast "Failed to reset policy" appears and the dialog stays open

Only superusers can reach this page, and Pulp resets any policy whose viewset still exists, so
this is the only way a reset fails.

## Permissions

### ACP-PERM-01 Only superusers can see or change access policies

Auth: second-user

Given a second user who is not a superuser
When they open Access policies
Then the table shows "403: Access denied" and there is no row to edit or reset

## Effect

### ACP-EFF-01 A policy change takes effect

Auth: second-user
Serial

Given a second user who can see the <page> list today
When I change the policy of <viewset> so that only admins may list it
Then the second user sees "403: Access denied" on <page>
When I reset the policy
Then the second user sees the list again

| page         | viewset                                          |
| ------------ | ------------------------------------------------ |
| Tasks        | `tasks`                                          |
| Repositories | `repositories` (the list of every type it reads) |
