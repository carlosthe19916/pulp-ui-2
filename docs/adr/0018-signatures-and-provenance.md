---
name: signatures-and-provenance
description: A signable content unit's details show its signatures (or, for Python, its provenance) with their keys, scoped to the version shown; signature units link to what they sign; the UI says what Pulp holds and never claims to have verified it.
status: Accepted
---

# 0018. Content shows its signatures and provenance

## Context

Pulp keeps signatures in several ways, depending on the plugin:

- **RPM and Debian** packages carry them inside the file. Pulp lists the signing keys on the
  package.
- **Container** images and **Ansible** collection versions have signatures stored as separate
  content units, each pointing at what it signs.
- **Container** cosign signatures, attestations and SBOMs are images of their own. Pulp marks
  them by kind, but doesn't record which image they belong to.
- **Python** packages can have a PEP 740 provenance: who published the package, from which
  repository and workflow, with entries in Sigstore's public transparency log.
- **OpenPGP keyrings** hold signatures over the keys themselves.

Before this decision, the UI only configured signing (signing services, sign actions, a remote's
signature settings) and marked signed items in Browse. Someone looking at one package or image
couldn't see who signed it, or with which key.

Pulp keeps what it receives but doesn't re-check it whenever it is read. The UI checks nothing
either. Registries and package indexes show this information the same way: a section on the
item's page naming the publisher or signer and the key, with the raw material one click away
(npm, PyPI), and signature artifacts shown as belonging to an image (Quay, Harbor).

## Rules

- [ ] The details of a signable unit (an RPM or Debian package, a container image or tag, an
      Ansible collection version) have a **Signatures** section. A Python package has a
      **Provenance** section instead.
- [ ] A signature shows its key: the long key ID always, and the full fingerprint when the
      signature carries one. It names the signing service that made it only when Pulp records
      one; it never guesses a service from the key.
- [ ] Wording says what Pulp holds ("Signed", "Signed by", "Provenance"), never that it was
      verified or can be trusted.
- [ ] Signatures and provenance are looked up in the version shown (in the content drawer) or
      in the whole domain (on the content page). The empty text names which one, e.g. "No
      signatures in this repository version". A package with no embedded signature reads
      "Unsigned package"; one whose keys Pulp didn't record (a synced package) reads "No signing
      keys recorded".
- [ ] Provenance shows the publisher, its source repository, workflow and environment, the
      number of attestations, and a link to each transparency log entry, with the raw provenance
      collapsed below them.
- [ ] A signature or provenance unit's own details link to the unit it signs or describes.
- [ ] Browse marks signed items "Signed" and Python packages with provenance "Provenance".
      Cosign signatures, attestations and SBOMs are marked by the kind Pulp records ("Cosign
      signature", "Cosign attestation", "SBOM"), not guessed from their tag names.
- [ ] A section with more signatures or provenances than fit on one page is paged.

## Consequences

- One section per signable type covers both the drawer and the content page, since they share
  the type's details. No new tab.
- Without a signing service lookup by key, a signature made outside Pulp shows only its key.
  Users compare it with the fingerprints on the Signing services page.
- Cosign artifacts aren't attached to the image they sign until Pulp records that link.
- Asks for Pulp: a fingerprint filter on signing services, a multi-value filter on Ansible
  signatures by collection, and a type filter on container manifests.
