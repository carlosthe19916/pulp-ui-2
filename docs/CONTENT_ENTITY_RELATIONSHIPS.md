# Content entity relationships (backend-grounded)

How **Remote**, **Repository**, **RepositoryVersion**, **Publication**, and
**Distribution** relate, derived from the Pulp OpenAPI schema (the source of
truth) rather than from the UI. Field citations use the generated client types in
`client/src/app/client/types.gen.ts`, which mirror `client/openapi/pulp.json`.
The `file` plugin is used as the concrete reference; other plugins follow the
same shape.

For the UI-facing view of these screens, see [UI_ENTITIES.md](UI_ENTITIES.md).

## The pipeline

Pulp models a content pipeline. Each entity references the one(s) upstream of it
by HREF.

```
Remote ──(sync, optional default)──▶ Repository
                                        │ owns
                                        ▼
                                 RepositoryVersion   (numbered, immutable, holds content)
                                        │ published as
                                        ▼
                                   Publication
                                        │
   Distribution ──serves one of──▶ { publication | repository (→latest ver) | repository_version }
        │
        ▼
   base_path / base_url   (what clients actually hit)
```

## Entity by entity

### Remote — external source config

`FileFileRemoteResponse` has **no reference to any other entity**. It is
standalone config: `url`, `policy`, TLS certs, proxy, timeouts. It describes
_where and how to fetch_ content from the outside world and is the root of the
graph — nothing points up from it.

### Repository — owns content, optionally bound to a Remote

`FileFileRepositoryResponse`:

- `remote?: string | null` — _"An optional remote to use by default when
  syncing."_ → **Repository → Remote** (many-to-one, optional).
- `versions_href` / `latest_version_href` — point at its versions.
- `autopublish?: boolean` — _"Whether to automatically create publications for
  new repository versions, and update any distributions pointing to this
  repository."_

The **sync action** (`RepositorySyncUrl`) takes `remote?` — _"A remote to sync
from. This will override a remote set on repository."_ So Remote and Repository
are linked at sync time; the repo's `remote` field is just a default.

### RepositoryVersion — immutable snapshot of a Repository

`RepositoryVersionResponse`:

- `repository?: string` → **RepositoryVersion → Repository** (many-to-one).
- `number`, `base_version`, `content_summary`.

Each sync or content change produces a new numbered version. This is what
actually holds content.

### Publication — rendered, servable snapshot of a RepositoryVersion

`FileFilePublicationResponse`:

- `repository_version?: string` → **Publication → RepositoryVersion**.
- `repository?: string` — convenience to publish the _latest_ version of a repo
  (the create body `FileFilePublication` accepts either).
- `distributions?: Array<string>` (readonly) — _"This publication is currently
  hosted as defined by these distributions."_ Reverse link to the Distributions
  serving it.

### Distribution — public serving endpoint

`FileFileDistributionResponse` is the **most polymorphic**. It has three
mutually-alternative upstream pointers plus a serving address:

- `base_path` (required) + `base_url` (readonly) — the URL where content is
  served.
- `publication?: string | null` — _"Publication to be served."_
- `repository?: string | null` — _"The latest RepositoryVersion for this
  Repository will be served"_ (auto-follows latest).
- `repository_version?: string | null` — _"RepositoryVersion to be served"_
  (pinned).
- `content_guard?`, `hidden?`, `checkpoint?`.

A Distribution points at **exactly one of** `publication` / `repository` /
`repository_version` as its content source.

## Implications for a UI refactor

1. **Remote and Repository belong together** on a sync-focused view. Remote has
   no identity of its own in the UI except as a sync source; Repository is the
   hub — the only entity users create content in, and it fans out to versions,
   publications, and distributions.
2. **RepositoryVersion, Publication, and Distribution are "views/snapshots"**
   hanging off a Repository. They are read-mostly and reference upstream by HREF.
   This matches the approved detail-pages design: Repository + Remote get tabbed
   detail pages, RepositoryVersion gets a route, Distribution + Publication are
   expandable rows.
3. **Distribution is the only one with branching cardinality** (three
   alternative source fields). Any shared render/edit abstraction must treat its
   source as a discriminated union, not a single FK — this is where a generic
   "entity" abstraction will leak if not handled explicitly.
