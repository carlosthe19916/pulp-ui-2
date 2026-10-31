---
area: remotes
routes:
  - /content-management/:domain/remotes
  - /content-management/:domain/remotes/create
  - /content-management/:domain/remotes/:type/:id
  - /content-management/:domain/remotes/:type/:id/edit
---

# Remotes

A remote tells Pulp where to sync content from. Each plugin type has its own form that leads with
what defines that remote; the shared form-page behaviour (Type select, sections, secrets, leave
prompt, permissions) is in [form-pages.md](form-pages.md).

## List

### RMT-LIST-01 Create and Edit open the form pages

Summary: The Remotes list's "Create remote" opens the create page, and a row's Edit opens that remote's edit page.

Seed: a file remote

When I click "Create remote" on the Remotes list
Then the create page opens with the title of the first installed type's form
When I go back and choose "Edit" in the file remote's row actions
Then "Edit file remote" opens with that remote's values filled in

## Create

### RMT-CRE-01 Create a remote of each distinctive form

Summary: Each remote form saves the fields that define its type, and the new remote's page shows them.

When I create a remote of type <type> with <values>
Then its detail page opens and shows <shown>

| type               | values                                                                            | shown                                        |
| ------------------ | --------------------------------------------------------------------------------- | -------------------------------------------- |
| File               | a PULP_MANIFEST URL and the "On demand" download policy                           | the URL and policy "on_demand"               |
| Ansible collection | the Galaxy URL and requirements listing ansible.posix                             | the requirements                             |
| Container          | a registry URL, upstream name "library/busybox", include tags "latest" and "1.36" | the upstream name and both include tags      |
| APT                | a Debian URL, distributions "bookworm", components "main", architectures "amd64"  | the distributions, components, architectures |
| Python             | the PyPI URL, include project "django" and package type "Wheel (bdist_wheel)"     | the include and the package type             |
| RPM (ULN)          | a ULN channel URL and the ULN username and password                               | the URL, with username and password "Set"    |

## Edit

### RMT-EDT-01 Edit from the detail page

Summary: Editing a remote from its detail page saves the change and returns to the detail page.

Seed: a container remote with include tag "latest"

When I open its detail page and choose "Edit" in the actions menu
Then "Edit container remote" opens
When I add the include tag "stable", remove "latest" and save
Then the toast "Remote "<name>" update started" appears and the detail page opens
And once the update task finishes, its include tags are only "stable"

### RMT-EDT-02 Cancel leaves without saving

Summary: Cancel on an unchanged edit page returns to the remote's page without changing it.

Seed: a file remote

When I open its edit page and choose "Cancel"
Then its detail page opens, with no prompt and no change on the server

## Detail

### RMT-DET-01 Settings are grouped like the form

Summary: A remote's Details tab groups and labels its settings the way its form does, secrets as Set or Not set.

Seed: a container remote with an upstream name, a password, a sigstore URL and a proxy URL

When I open its Details tab
Then the settings are in cards titled, in order, "General", "Authentication", "Signatures",
"TLS", "Proxy", "Downloads", "Timeouts" and "Metadata"
And the cards use the form's labels ("Upstream name", "Include tags", "Sigstore URL", …)
And Password shows "Set" and Username "Not set", never a value
And labels appear in the Metadata card, not as a form setting

## Delete

### RMT-DEL-01 Delete a remote

Summary: Deleting a remote from the list removes it after confirmation.

Seed: a file remote

When I choose "Delete" in its row actions and confirm "Delete Remote"
Then the toast "Remote "<name>" deletion started" appears and the row disappears

## Other layers

| Behaviour                                                                            | Layer      |
| ------------------------------------------------------------------------------------ | ---------- |
| Every remote type's form covers its API fields; single-value policies are omitted    | type check |
| Every catalog remote type has a form                                                 | component  |
| The Galaxy warning shows while syncing galaxy.ansible.com without requirements       | component  |
| Required plugin fields (container upstream name, APT distributions, ULN credentials) | component  |
| "Use template" fills an empty requirements editor                                    | component  |
| Edit is disabled, with a tooltip, for a remote type without a form                   | component  |
| Remote write rules (name unique across types, plugin required fields, URL formats)   | API        |
