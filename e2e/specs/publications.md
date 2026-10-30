---
area: publications
routes:
  - /content-management/:domain/publications
  - /content-management/:domain/publications/create
---

# Publications (create)

A publication is an immutable, published snapshot of a repository version. It is created on a
form page and never edited; it has no detail page, so creating returns to the list. The shared
form-page behaviour is in [form-pages.md](form-pages.md).

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

### PUB-CRE-04 APT publications by structure

Summary: An APT repository can be published as a structured APT publication or as a verbatim copy, each with its own options.

Seed: an APT repository synced from a small Debian fixture

When I create a publication of Type <type> with <options>
Then the publication is created and its expanded row shows <shown>

| type     | options                          | shown                                 |
| -------- | -------------------------------- | ------------------------------------- |
| APT      | Structured on, a signing service | its type, "Structured" and the signer |
| Verbatim | (none)                           | its type                              |

## Edit

### PUB-EDT-01 Publications can't be edited

Summary: Publications offer no Edit action, since a publication is immutable.

Seed: a file publication

When I open its row actions
Then there is no "Edit" action

## Other layers

| Behaviour                                                                | Layer      |
| ------------------------------------------------------------------------ | ---------- |
| Every publication type's form covers its API fields                      | type check |
| Choosing a repository version instead of the repository swaps the picker | component  |
| APT publication options show only for the APT type                       | component  |
| Publication write rules (one of repository or version, signing service)  | API        |
