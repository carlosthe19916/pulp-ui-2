---
area: form-pages
routes:
  - /content-management/:domain/remotes/create
  - /content-management/:domain/remotes/:type/:id/edit
---

# Create and edit form pages

Repositories, remotes, distributions and publications are created and edited on their own pages,
one form per plugin type ([ADR 0009](../../docs/adr/0009-plugin-form-pages.md)). Every form page
shares the behaviour below; it is exercised once, on the **remote** form pages as the reference
surface. Each entity's spec ([remotes](remotes.md), [repositories](repositories.md),
[distributions](distributions.md), [publications](publications.md)) covers only its own journeys.

A form page has a header (breadcrumbs and a title such as "Create file remote"), an always-open
"General" section, collapsible sections (Authentication, TLS, Proxy, Downloads, Timeouts,
Labels, and plugin sections), jump links when there are four or more sections, and a sticky
footer with "Create" or "Save" and "Cancel".

## Type

### FORM-TYPE-01 The Type select lists installed types and swaps the form

Summary: The create page's Type select lists only installed plugin types, and choosing one shows that type's own form.

When I open "Create remote" from the Remotes list
Then the first field is "Type", listing the remote types of the installed plugins by name
("File", "Ansible collection", "Container", …)
When I choose <type>
Then the title is <title> and the General section shows <field>, which the File form doesn't have

| type               | title                              | field         |
| ------------------ | ---------------------------------- | ------------- |
| Ansible collection | "Create Ansible collection remote" | Requirements  |
| Container          | "Create container remote"          | Upstream name |

### FORM-TYPE-02 Switching type keeps the shared values

Summary: Values both types' forms share survive a type switch; values only the old type has are dropped.

Given I am creating a Container remote and entered a name, a URL, a password and the upstream
name "library/busybox"
When I switch the Type to "File"
Then the name, URL and password are still filled in
When I switch back to "Container"
Then the upstream name is empty

### FORM-TYPE-03 The selected type is part of the address

Summary: The create page's address carries the selected type, so reloading or sharing it opens the same form.

Given I chose "Ansible collection" on the create page
When I reload the page
Then the "Create Ansible collection remote" form is shown again
And opening a create address whose type isn't installed shows the first installed type's form

## Sections

### FORM-SEC-01 Sections holding a value open on edit

Summary: An edit page opens the sections whose fields hold a value and keeps the others collapsed with a summary.

Seed: a file remote with a password, a CA certificate and TLS verification turned off

When I open its edit page
Then the Authentication and TLS sections are expanded and Proxy, Downloads and Timeouts are
collapsed
And collapsing TLS shows the summary "Verify off" next to its title

## Saving

### FORM-SAVE-01 Creating leaves for the new object

Summary: A successful create shows a success toast and opens the new object's page, without asking to leave.

When I create a file remote
Then the toast "Remote "<name>" created" appears and its detail page opens
And no "Leave without saving?" prompt appeared

### FORM-SAVE-02 Editing sends only what changed

Summary: Saving an edit changes only the edited fields; a field emptied by the user is cleared on the server.

Seed: a file remote with a URL, a CA certificate, a download concurrency of 5 and a password

When I open its edit page, change the URL, empty the CA certificate and Download concurrency, and
save
Then the toast "Remote "<name>" update started" appears (an edit runs as a task) and its detail
page opens
And once the task finishes, the server has the new URL, no CA certificate and no download concurrency, while the
password is still set and every other setting is unchanged

### FORM-SAVE-03 A server error stays in the form

Summary: When the server rejects a submit, the error shows at the top of the form and what was typed is kept.

Seed: an RPM remote named "taken"

When I create a file remote named "taken"
Then the in-form error "Failed to create remote" appears with the server's reason "This field
must be unique." (remote names are unique across every remote type)
And the page stays open with everything I typed

## Secrets

### FORM-SECRET-01 Passwords and tokens are never shown

Summary: An edit page shows only whether a write-only value is set, and saving without touching it keeps it.

Seed: a file remote with a password and no username

When I open its edit page and expand Authentication
Then Password shows "Set" with "Change" and "Clear", and Username shows "Not set" with "Set"
And no field shows the password's value
When I change the URL and save
Then the password is still set on the server

### FORM-SECRET-02 Changing and clearing a secret

Summary: A changed secret is replaced and cleared secrets are removed on the server.

Seed: a file remote with a password, a proxy URL, a proxy username and a proxy password

When I open its edit page, choose "Change" on Password and enter a new value, choose "Clear" on
Proxy username and on Proxy password, and save
Then the server reports the password still set (it can't be read back) and neither proxy
credential set, while the proxy URL is unchanged

### FORM-SECRET-03 Proxy credentials go together

Summary: Clearing only one proxy credential is refused by the server, and the reason shows in the form.

Seed: a file remote with a proxy URL, a proxy username and a proxy password

When I open its edit page, choose "Clear" on Proxy password only, and save
Then the in-form error "Failed to update remote" shows the server's reason "proxy username and
password can only be specified together", and the page stays open
And the server still has both proxy credentials set

## Code editor

### FORM-CODE-01 Upload a file into a code field

Summary: A code field accepts an uploaded file, and its content is what gets saved.

When I create an Ansible collection remote and upload a requirements.yml file into Requirements
Then the editor shows the file's content
And after creating, the remote's requirements on the server equal the file's content

## Leaving

### FORM-LEAVE-01 Leaving with unsaved changes asks first

Summary: Navigating away from a form with unsaved changes asks for confirmation; staying keeps the input.

Given I typed a name on the create page
When I click the "Remotes" breadcrumb
Then the "Leave without saving?" prompt opens
When I choose "Stay"
Then the prompt closes and the name is still there
When I click the breadcrumb again and choose "Leave"
Then the Remotes list opens

### FORM-LEAVE-02 Values carried over a type switch count as unsaved

Summary: After a type switch carries values over, leaving still asks for confirmation.

Given I typed a name, switched the Type and changed nothing else
When I click the "Remotes" breadcrumb
Then the "Leave without saving?" prompt opens

## Permissions

### FORM-PERM-01 Editing without change permission

Summary: A user who can view a remote but not change it sees Edit disabled, and its edit address shows the access-denied state.

Auth: second-user
Seed: a file remote; a second user with the "file.fileremote_viewer" role on it

Given I am the second user
When I open the remote's row actions in the Remotes list and the actions menu on its detail page
Then "Edit" is disabled with the tooltip "You don't have permission to change this."
When I open the remote's edit address directly
Then "403: Access denied" is shown, saying I don't have permission to change the remote, and no
form fields are shown

### FORM-PERM-02 Creating without create permission

Summary: A user without create permission can open the create page, and the server's refusal shows in the form.

Auth: second-user

Given I am a second user with no roles
Then "Create remote" on the Remotes list is enabled (Pulp can't tell the UI who may create)
When I fill in a file remote and submit
Then the in-form error "Failed to create remote" shows the server's reason "You do not have
permission to perform this action.", and the page stays open

## Addresses

### FORM-ROUTE-01 Edit addresses that don't resolve

Summary: An edit address for an unknown remote, a remote I can't view, or an unknown type shows an error state instead of the form.

Auth: second-user (the "can't view" row)
Seed: a file remote; a second user with no roles

When I open the edit address of <target>
Then <outcome>

| target                                | outcome                      |
| ------------------------------------- | ---------------------------- |
| a remote id that doesn't exist        | the "not found" error state  |
| the seeded remote, as the second user | the "not found" error state  |
| a type the UI doesn't know            | the detail-route error state |

Pulp answers "not found", not "forbidden", for an object the user can't view, so the UI can't
tell the two apart; only a user who can view but not change gets "403: Access denied"
(FORM-PERM-01).

## Other layers

Behaviour that needs no backend is covered by component tests (Vitest), next to the code; the
server's own rules by the API layer. Neither repeats here.

| Behaviour                                                                 | Layer      |
| ------------------------------------------------------------------------- | ---------- |
| A definition renders or omits every API field, with a kind that fits it   | type check |
| Required fields, URL, number, YAML, JSON and PEM validation messages      | component  |
| A failed submit opens the collapsed section holding the error             | component  |
| Fields hidden by a condition are neither validated nor sent               | component  |
| A field set but hidden by a condition (secrets included) is cleared       | component  |
| Edit body: only changes, empty → clear value, read-only and labels unsent | component  |
| Save stays disabled until something changes; an empty edit sends nothing  | component  |
| Secret field states: Set / Not set / Change / Clear / Undo                | component  |
| Selects keep their options' value types; required selects show a prompt   | component  |
| Jump links open and scroll to their section                               | component  |
| Collapsed-section summaries ("2 set", "Verify off", the proxy URL)        | component  |
| No leave prompt after a save reports success                              | component  |
| The edit page renders access denied without change permission             | component  |
| The edit page warns, and keeps the form, while a task runs on the object  | component  |
| Chips, key-value rows and checkboxes edit their lists                     | component  |
| Proxy credentials only together and only with a proxy URL (server rules)  | API        |
