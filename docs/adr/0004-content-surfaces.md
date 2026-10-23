---
name: content-surfaces
description: Content is immutable and shown in three places — global list, content page, version content with a drawer; no admin download.
status: Accepted
---

# 0004. Content is shown globally, per unit and per version

## Context

A content unit is an immutable, typed record (a package, a tag, a file) that points at zero or
more artifacts (stored files). Repository versions hold content, not repositories. The API can
list a version's content but can't list every version that contains a unit.

## Rules

- [ ] **Content list** (global): every unit in the domain, filterable by type, label,
      repository version, orphaned state, and the difference between two versions.
- [ ] **Content page**: Details rendered for the unit's type, Artifacts (size, checksums),
      and Repositories (repositories whose _latest_ version holds it).
- [ ] **Version content**: inside a repository or version page, the version's content with a
      side drawer showing the same per-type details.
- [ ] Content is never edited in place; it is added, removed or uploaded
      ([0006](0006-content-changes-target-latest-version.md), [0007](0007-upload.md)).
- [ ] No artifact download from the admin UI; downloads go through a distribution.

## Consequences

- The Repositories tab answers "where is this now", not "where has this ever been".
