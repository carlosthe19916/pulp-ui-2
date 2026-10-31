---
area: repositories
routes:
  - /content-management/:domain/repositories
  - /content-management/:domain/repositories/create
  - /content-management/:domain/repositories/:type/:id
  - /content-management/:domain/repositories/:type/:id/edit
---

# Repositories (create and edit)

This spec covers creating and editing repositories on their form pages; the rest of the
repository hub (versions, content, sync, publish) keeps its own scenarios. The shared form-page
behaviour is in [form-pages.md](form-pages.md).

A repository form leads with its remote (filtered to the types it can sync from), the number of
retained versions and, for plugins that publish, Auto-publish; plugin settings (a signing
service, metadata options) follow in their own sections.

Each signing-service field accepts only its own kind of service (RPM metadata, RPM package, APT
release, container manifest). Pulp's signing-service list can't filter by kind, so every picker
lists every service and the server rejects a wrong one ("Invalid hyperlink - Object does not
exist."). The e2e backend's "pulp-ui-dev-signing" signs RPM metadata only.

## List and detail

### REP-LIST-01 Create and Edit open the form pages

Summary: "Create repository" opens the create page, and Edit in a row or on the detail page opens that repository's edit page.

Seed: a file repository

When I click "Create repository" on the Repositories list
Then the create page opens with its Type select
When I choose "Edit" in the file repository's row actions
Then "Edit file repository" opens with its values filled in
When I choose "Edit" in its detail page's actions menu
Then the same edit page opens

## Create

### REP-CRE-01 Create a repository of each distinctive form

Summary: Each repository form saves the fields that define its type, and the new repository's page shows them.

Seed: a file remote, an RPM remote

When I create a repository of type <type> with <values>
Then the toast "Repository "<name>" created" appears, its detail page opens, and the About card
on its Details tab shows <shown>

| type      | values                                                                      | shown                                        |
| --------- | --------------------------------------------------------------------------- | -------------------------------------------- |
| File      | a description, the seeded file remote, Auto-publish on, 3 retained versions | the description, the remote, Auto-publish, 3 |
| RPM       | the seeded RPM remote and "pulp-ui-dev-signing" as Metadata signing service | the remote and a "Metadata signing service"  |
| Container | a description                                                               | the description                              |

### REP-CRE-02 The remote picker offers only compatible remotes

Summary: A repository's Remote picker lists only remotes of the types that repository can sync from.

Seed: a file remote, an RPM remote

When I open the create page with Type "File" and open the Remote picker
Then the file remote is offered and the RPM remote is not
When I switch the Type to "RPM"
Then the RPM remote is offered and the file remote is not

### REP-CRE-03 Push repositories can't be created

Summary: Push-only repository types are not offered on the create page but can still be edited.

Manual
Seed: a container push repository (only an image push creates one)

When I open the Type select on the create page
Then it offers "Container" but no container push type
When I choose "Edit" on the push repository
Then its edit page opens and saving a new description persists it

## Edit

### REP-EDT-01 Change and clear repository settings

Summary: Editing a repository saves changed settings and clears the ones the user empties.

Seed: a file repository with a description, a remote and 5 retained versions

When I open its edit page, empty Description, remove the remote, set 2 retained versions and save
Then the toast "Repository "<name>" update started" appears (an edit runs as a task) and its
detail page opens
And once the task finishes, the server has no description (null: Pulp rejects a blank one), no
remote and 2 retained versions

### REP-EDT-02 Editing while a task runs

Summary: While a task runs on a repository, Edit stays enabled and the edit page warns, and the saved update is applied after the task.

Seed: a file repository with a remote and a sync running

When I open its detail page's actions menu
Then "Sync" and "Delete" are disabled with the tooltip "Wait for the running task to finish", but
"Edit" is enabled
When I choose "Edit"
Then the alert "Sync in progress" says "You can still save: your changes are applied when the
task finishes." and links to the task
When I change the description and save
Then the toast "Repository "<name>" update started" appears and the detail page opens
And once the sync finishes, the server has the new description

Pulp queues the update behind the repository's lock and runs it when the sync finishes.

## Detail

### REP-DET-01 About settings follow the form

Summary: A repository's About card labels its settings the way its form does.

Seed: an RPM repository with a remote, "pulp-ui-dev-signing" as metadata signing service and 3
retained versions

When I open its Details tab
Then its settings use the form's labels ("Remote", "Retained versions", "Metadata signing
service", …) and the remote links to the remote's page

## Other layers

| Behaviour                                                                       | Layer      |
| ------------------------------------------------------------------------------- | ---------- |
| Every repository type's form covers its API fields; deprecated ones are omitted | type check |
| Every catalog repository type has a form; push types are edit-only              | component  |
| Auto-publish shows only for plugins that publish                                | component  |
| Retained versions accepts only a positive whole number or nothing               | component  |
| Repository write rules (unique name, blank description, signing-service kind)   | API        |
