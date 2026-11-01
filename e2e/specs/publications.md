---
area: publications
routes:
  - /content-management/:domain/publications
  - /content-management/:domain/publications/create
  - /content-management/:domain/publications/:type/:id
---

# Publications (create and detail)

A publication is an immutable, published snapshot of a repository version. It is created on a
form page and never edited. Each publication has a detail page (Details, Access); list rows don't
expand. Creating returns to the list (the create runs as a task). The shared form-page behaviour
is in [form-pages.md](form-pages.md).

## Create

### PUB-CRE-01 Create a publication of a repository

Summary: Publishing a repository's latest version creates a publication listed after its task finishes.

Seed: a file repository with content

When I click "Create publication", choose Type "File", pick the repository and choose "Create"
Then the Publications list opens with the toast "Publication creation started"
And when the task finishes, a publication of the repository's latest version is listed

### PUB-CRE-02 Publish a specific repository version

Summary: A publication can be made from an older repository version instead of the latest.

Seed: a file repository with two versions

When I create a file publication of the repository's version 1
Then the new publication is of version 1, not the latest

### PUB-CRE-03 The repository picker offers only repositories that can publish

Summary: The create page's Repository picker lists only repositories whose type can be published as the chosen type.

Seed: a file repository, a container repository

When I choose Type "File" and open the Repository picker
Then the file repository is offered and the container repository is not

The picker is the only guard: Pulp accepts a file publication of a container repository and the
task completes, producing a publication no client can use.

### PUB-CRE-04 APT publications by structure

Summary: An APT repository can be published as a structured APT publication or as a verbatim copy.

Seed: an APT repository

When I create a publication of Type <type> with <options>
Then once its task finishes, the list shows it with the type <listed>
And the server has <stored>

| type           | options       | listed                   | stored           |
| -------------- | ------------- | ------------------------ | ---------------- |
| APT            | Structured on | deb.apt-publication      | structured: true |
| APT (verbatim) | (none)        | deb.verbatim-publication | —                |

Signing an APT publication is a manual check: the e2e backend has no APT release signing
service.

## Edit

### PUB-EDT-01 Publications can't be edited

Summary: Publications offer no Edit action, since a publication is immutable.

Seed: a file publication

When I open its row actions
Then there is no "Edit" action

Pulp itself allows only reading and deleting a publication.

## Detail

### PUB-DET-01 Open a publication's page from its name

Summary: A publication's name links to its detail page from the Publications list and from its repository's Publications tab.

Seed: a file publication of a file repository

When I click the publication's id in the Publications list
Then its detail page opens with the title "Publication <id>", the label "plugin: file.file" and
the tabs Details and Access
When I go to the repository's Publications tab and click its id
Then the same detail page opens

### PUB-DET-02 Details show its source, serving distributions and settings

Summary: The Details tab shows the repository and version it was published from, the distributions serving it, its publishing settings and metadata.

Seed: a file repository, a file publication of it, and a file distribution serving the publication

When I open the publication's Details tab
Then the "Source" card shows the repository and its version as links, and the distribution's name
as a link
And the "Publishing" card shows the manifest file name "PULP_MANIFEST"
And the "Metadata" card shows its creation time and its PRN
When I click the distribution's name
Then the distribution's detail page opens, and its publication links back to this page

### PUB-DET-03 Delete from the detail page

Summary: The detail page offers Delete and no Edit; deleting removes the publication and returns to the list.

Seed: a file publication

When I open its detail page's actions menu
Then there is "Delete" and no "Edit"
When I choose "Delete" and confirm "Delete Publication"
Then the toast "Publication "<id>" deleted" appears and the Publications list opens

## Other layers

| Behaviour                                                                | Layer      |
| ------------------------------------------------------------------------ | ---------- |
| Every publication type's form covers its API fields                      | type check |
| Choosing a repository version instead of the repository swaps the picker | component  |
| APT publication options show only for the APT type                       | component  |
| Publication write rules (exactly one of repository or version)           | API        |
| Details card layout: source links, settings from the form, no labels     | component  |
