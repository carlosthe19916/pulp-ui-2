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

### ACP-EDT-02 Values Pulp accepts but that break the endpoint

Serial

Client JSON validation (empty, `[`) is a component test (the Edit policy modal's `*.test.tsx`);
the server's 400-shape rejections (not-a-list, item-not-an-object) are an **api contract** test
(`access-policies.api.spec.ts`). Only e2e can show the ⚠ values Pulp saves without checking,
whose damage shows on the endpoint afterwards — keep the main representatives:

When I set <field> to <value> and click "Save"
Then <outcome>

| field            | value                            | outcome                                                                                  |
| ---------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| Statements       | `[]`                             | ⚠ saved; afterwards everyone, admin included, gets "403: Access denied" on that endpoint |
| Statements       | a statement without `principal`  | ⚠ saved; afterwards requests to that endpoint fail with a server error                   |
| Queryset scoping | `{"function": "not_a_function"}` | ⚠ saved; afterwards the endpoint's list fails with a server error                        |

⚠ Pulp accepts these values without checking them, and the damage only shows on the endpoint
the policy guards. Use a viewset nothing else in the run needs, and reset it right after.

### ACP-EDT-03 A successful save

Serial

Given a policy with Status Default
When I change its statements to a valid list and save
Then the toast `Policy "<viewset>" saved` appears, the modal closes, the row's Status is
Customized and the Statements count matches
And "Reset to default" becomes enabled

### ACP-EDT-05 Clearing an optional field

Clearing Creation hooks or Queryset scoping exposes the same "the form omits an empty field" UI
gap kept once as [USR-EDT-05](users.md#usr-edt-05-clearing-a-text-field) (Pulp refuses an
empty/null value, so the saved value stays); not tested separately per entity.

ACP-EDT-04 (several invalid fields at once) and ACP-EDT-06 (the server error clears on close) are
generic modal behaviour, covered by the form modal's component tests (`*Modal.test.tsx`).

### ACP-EDT-07 Editing an already customized policy

Serial

Given a customized policy
When I open Edit and save (even with nothing changed)
Then Status stays Customized and the statements shown are the ones saved (Pulp marks a policy
Customized on every save)

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

Given a second user who can see the Tasks list today
When I change the `tasks` policy so that only admins may list it
Then the second user sees "403: Access denied" on Tasks
When I reset the policy
Then the second user sees the list again

This one representative proves a policy change takes effect end to end; other endpoints use the
same mechanism and are not retested.
