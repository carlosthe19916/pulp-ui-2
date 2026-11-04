---
title: Core entities
sidebar_position: 2
---

# Core entities

Pulp is made of a handful of objects. Each maps roughly onto something you already know from a
repository manager; the surprises are called out.

## Content and artifacts

**Content** is a single logical item — an RPM package, a Python wheel, a container manifest, an
Ansible collection. It's **global and immutable**: it isn't owned by a repository, and the same unit
can appear in many repositories at once (like the same image layer shared across Docker Hub repos).

The actual bytes on disk are **Artifacts**, deduplicated by checksum. One content unit can have
several artifacts (a container manifest and its blobs); one artifact can back many content units.

> Surprise: deleting a repository doesn't delete its packages — the content and its bytes stay until
> [orphan cleanup](../administration/maintenance.md) removes what nothing references.

## Repository

A bucket that holds content of **one plugin's type** — an RPM repository can't hold Python
packages. You add, remove and sync content here. This is Artifactory's or Nexus's **hosted repo**.

## Repository version

An **immutable snapshot** of a repository's content set. Version 0 is empty. A new version is
created **only when the content actually changes** — a no-op sync makes none. Nothing edits a
version in place; every change appends a new one, which is what makes rollback trivial. See
[Versions and rollback](../using-pulp/versions-and-rollback.md).

## Remote

The configuration of an **external source**: upstream URL, credentials, TLS, proxy, and a
[download policy](./download-policies.md). A Remote does nothing on its own; a **sync** uses it to
pull content into a repository. It's the "remote" half of an Artifactory proxy repo, kept as a
reusable object you can point several repositories at.

## Publication

Metadata generated from a repository version in the exact format a client expects — `repomd.xml`
for `dnf`, the `Release`/`Packages` index for `apt`. Think of it as the generated repo index.

Only some ecosystems use publications:

| Needs a publication | Serves straight from the version                             |
| ------------------- | ------------------------------------------------------------ |
| RPM, Debian, Gem    | Python, Ansible, Container, OSTree, npm, Maven, Hugging Face |

## Distribution

The object that actually **serves** content, at a stable URL (`base_path`). It points at a
Repository (serving its latest version automatically), a specific version, or a Publication.
Nothing you create is reachable by a client until a Distribution exposes it — creating a repository
is not the same as publishing it. Optionally, a [content guard](../administration/content-guards.md)
on the Distribution controls who can download.

## How they relate

See [The content workflow](./content-workflow.md) for the end-to-end picture, and the
[Glossary](./glossary.md) for a one-line recap of each term.
