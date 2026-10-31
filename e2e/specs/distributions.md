---
area: distributions
routes:
  - /content-management/:domain/distributions
  - /content-management/:domain/distributions/create
  - /content-management/:domain/distributions/:type/:id
  - /content-management/:domain/distributions/:type/:id/edit
---

# Distributions (create, edit and detail)

A distribution serves content at a base path. It serves exactly one source: a repository's latest
version, one repository version, or a publication. Each distribution has a detail page (Details,
Tasks, Access); rows also expand in the list for a quick look. Create and edit are form pages:
creating returns to the list (the create runs as a task), editing returns to the detail page.
The shared form-page behaviour is in [form-pages.md](form-pages.md).

## List

### DST-LIST-01 Create and Edit open the form pages

Summary: "Create distribution" opens the create page, and a row's Edit opens that distribution's edit page.

Seed: a file distribution

When I click "Create distribution" on the Distributions list
Then the create page opens with its Type select
When I choose "Edit" in the file distribution's row actions
Then "Edit file distribution" opens with its values filled in

## Create

### DST-CRE-01 Create a distribution serving each kind of source

Summary: A distribution can serve a repository's latest version, one repository version or a publication.

Seed: a file repository with two versions and a publication of version 1

When I create a file distribution with a base path and choose <source>
Then the Distributions list opens with the toast "Distribution "<name>" creation started"
And when the task finishes, the row expanded shows <serves>

| source                                  | serves                      |
| --------------------------------------- | --------------------------- |
| "Repository" and pick the repository    | the repository (latest)     |
| "Repository version" and pick version 1 | version 1 of the repository |
| "Publication" and pick the publication  | the publication             |

### DST-CRE-02 A base path in use is rejected in the form

Summary: Although a distribution is created by a task, a taken base path is refused at submit and shown in the form.

Seed: a file distribution with base path "files/stable"

When I create another file distribution with base path "files/stable"
Then the in-form error "Failed to create distribution" shows the server's reason "This field
must be unique.", no task starts, and the page stays open with what I typed

### DST-CRE-03 A content guard protects a distribution

Summary: A distribution can be created with a content guard, and its row shows the guard.

Seed: a file repository, an RBAC content guard

When I create a file distribution serving the repository with that content guard
Then the row expanded shows the content guard

## Edit

### DST-EDT-01 Switching the source clears the old one

Summary: Changing a distribution's source to another kind stops serving the old source.

Seed: a file distribution serving a publication

When I open its edit page, choose "Repository" as the source, pick a repository and save
Then the toast "Distribution "<name>" update started" appears and the detail page opens
And once the task finishes, the server has the repository set and no publication

Pulp refuses a distribution with both a repository and a publication, so the save must clear the
old source.

### DST-EDT-02 Rename the base path

Summary: Editing a distribution's base path moves where its content is served.

Seed: a file distribution with base path "files/old"

When I change its base path to "files/new" and save
Then its detail page shows the base path "files/new" once the update task finishes

## Detail

### DST-DET-01 Open a distribution's page from its name

Summary: A distribution's name links to its detail page from the Distributions list and from its repository's Distributions tab.

Seed: a file repository and a file distribution serving it

When I click the distribution's name in the Distributions list
Then its detail page opens with the title of its name, the label "plugin: file.file" and the
tabs Details, Tasks and Access
When I go to the repository's Distributions tab and click the distribution's name
Then the same detail page opens

### DST-DET-02 Details show how it is served and its settings

Summary: The Details tab shows the serving URL, client setup and source, then the settings grouped like the form, then metadata.

Seed: a file repository, an RBAC content guard, and a file distribution serving the repository
with that content guard and the label "env: prod"

When I open the distribution's Details tab
Then the "Serving" card shows its base URL, client setup and the repository as a link
And the "General" and "Access" cards show the base path and the content guard, with the form's
labels
And the "Metadata" card shows the label "env: prod", its creation time and its PRN

### DST-DET-03 Edit and delete from the detail page

Summary: The detail page's Edit opens the edit page, whose breadcrumb leads back; Delete removes the distribution and returns to the list.

Seed: a file distribution

When I choose "Edit" in its detail page's actions menu
Then "Edit file distribution" opens, and its breadcrumb's distribution name links back to the
detail page
When I choose "Cancel"
Then the detail page opens
When I choose "Delete" in the actions menu and confirm "Delete Distribution"
Then the toast "Distribution "<name>" deletion started" appears and the Distributions list opens

### DST-DET-04 A distribution's task history

Summary: The Tasks tab lists the update tasks run on the distribution, their count in the tab title.

Seed: a file distribution, edited once so an update task ran

When I open its Tasks tab
Then the tab title counts one task and the update task is listed

The create task isn't listed: it ran before the distribution existed, so it didn't reserve it.

## Other layers

| Behaviour                                                                                 | Layer      |
| ----------------------------------------------------------------------------------------- | ---------- |
| Every distribution type's form covers its API fields                                      | type check |
| The source choice shows only the picker it needs; switching source sends the others empty | component  |
| The publication picker lists only publications of the distribution's type                 | component  |
| Base path accepts no leading or trailing slash                                            | component  |
| Distribution write rules (unique name and base path, overlap, canonical path, one source) | API        |
