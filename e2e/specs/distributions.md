---
area: distributions
routes:
  - /content-management/:domain/distributions
  - /content-management/:domain/distributions/create
  - /content-management/:domain/distributions/:type/:id/edit
---

# Distributions (create and edit)

A distribution serves content at a base path. It serves exactly one source: a repository's latest
version, one repository version, or a publication. Distributions have no detail page: their
details expand in the list, and create and edit are form pages that return to the list. The
shared form-page behaviour is in [form-pages.md](form-pages.md).

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

### DST-CRE-02 A taken base path is rejected

Summary: Creating a distribution with a base path already in use shows the server's reason in the form.

Seed: a file distribution with base path "files/stable"

When I create another file distribution with base path "files/stable"
Then the in-form error "Failed to create distribution" names the base path conflict, and the
page stays open with what I typed

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
Then the Distributions list opens with the update toast
And the server has the repository set and no publication

### DST-EDT-02 Rename the base path

Summary: Editing a distribution's base path moves where its content is served.

Seed: a file distribution with base path "files/old"

When I change its base path to "files/new" and save
Then the row shows "files/new" once the update task finishes

## Other layers

| Behaviour                                                                                 | Layer      |
| ----------------------------------------------------------------------------------------- | ---------- |
| Every distribution type's form covers its API fields                                      | type check |
| The source choice shows only the picker it needs; switching source sends the others empty | component  |
| The publication picker lists only publications of the distribution's type                 | component  |
| Base path accepts no leading or trailing slash                                            | component  |
| Distribution write rules (unique name and base path, one source at a time)                | API        |
