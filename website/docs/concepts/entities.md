---
title: Core entities
sidebar_position: 2
---

# Core entities

Pulp is made of a handful of objects. Each maps roughly onto something you already know from a
repository manager; the surprises are called out.

## Content (a package)

A single logical item — an RPM package, a Python wheel, a container manifest. Content is
**global and immutable**: it isn't owned by a repository, and the same unit can appear in many
repositories. The actual bytes on disk are **Artifacts**, deduplicated by checksum.

> Surprise: deleting a repository doesn't delete its packages; orphan cleanup does.

## Repository

A bucket that holds content of **one plugin's type** (an RPM repo can't hold Python packages).
You add, remove and sync content here. This is Artifactory's "hosted repo."

## Repository version

An **immutable snapshot** of a repository's content set. Version 0 is empty. A new version is
created **only when the content actually changes** — a no-op sync makes none. This is what makes
rollback trivial.

## Remote

The configuration of an **external source**: upstream URL, credentials, TLS, proxy, and a
[download policy](./download-policies.md). A Remote does nothing by itself; a **sync** uses it to
pull content into a repository. Remotes are reusable across repositories.

## Publication

Metadata generated from a repository version in the exact format a client expects (for example
`repomd.xml` for `dnf`). Only some ecosystems use publications — **RPM, Debian and Gem** do;
**Python, Ansible, Container, OSTree, npm, Maven and Hugging Face** serve straight from a
repository version.

## Distribution

The thing that actually **serves** content, at a stable URL (`base_path`). It points at a
Repository (serving its latest version automatically), a specific version, or a Publication.
Nothing you create is reachable by a client until a Distribution exposes it.

## How they relate

See [The content workflow](./content-workflow.md) for the end-to-end picture.
