---
area: access-policies
routes: [/admin/access-policies]
---

# Access policies

Every scenario that edits or resets a policy changes server-wide behaviour: it is `Serial` and
must restore the policy to its default afterwards, even when it fails.

## List

### ACP-LIST-01 Page and row content

When I open Access policies from the Administration navigation
Then the heading is "Access policies", the nav item is highlighted, and the page text reads "Each
policy decides who may call one API endpoint. Changing them is advanced; reset a policy to restore
its plugin's default."
And the table shows 20 rows per page, with no create button and no delete action
And each row shows its viewset name (plain text), a Statements count, a Status label — Default, or
Customized once edited — and row actions "Edit" and "Reset to default"

## Edit

### ACP-EDT-02 Values Pulp accepts but that break the endpoint

Serial

Pulp saves these values without checking them; the damage only shows on the endpoint the policy
guards. Use a viewset nothing else in the run needs, and reset it right after.

When I set <field> to <value> and click "Save"
Then <outcome>

| field            | value                            | outcome                                                                                |
| ---------------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| Statements       | `[]`                             | saved; afterwards everyone, admin included, gets "403: Access denied" on that endpoint |
| Statements       | a statement without `principal`  | saved; afterwards requests to that endpoint fail with a server error                   |
| Queryset scoping | `{"function": "not_a_function"}` | saved; afterwards the endpoint's list fails with a server error                        |

### ACP-EDT-03 A successful save

Serial

Given a policy with Status Default
When I change its statements to a valid list and save
Then the toast `Policy "<viewset>" saved` appears, the modal closes, the row's Status is
Customized, the Statements count matches, and "Reset to default" becomes enabled
When I open Edit on that now-customized policy and save again (even unchanged)
Then Status stays Customized and the saved statements are shown (Pulp marks a policy Customized on
every save)

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
When I click "Reset to default"
Then the dialog "Reset access policy" shows `Restore "<viewset>" to its default? Your changes to
it are lost.` with a "Reset" button
When I confirm
Then the toast `Policy "<viewset>" reset to its default` appears, Status is Default, the
Statements count is back to the default, Edit shows the default values for all three fields, and
"Reset to default" is disabled again

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
