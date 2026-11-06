---
area: content
routes:
  - /content-management/:domain/repositories/:type/:id
  - /content-management/:domain/content/:type/:id
---

# Content signatures and provenance

A signable content unit's details (the drawer opened from a repository's Content tab, and the
content page) show its signatures, or for a Python package its provenance
([ADR 0018](../../docs/adr/0018-signatures-and-provenance.md)). Key formatting, which empty
text shows ("Unsigned package", "No signing keys recorded") and reading the provenance are
component tests. These scenarios cover what needs the real backend: what Pulp records for real
signed content, where it is looked up, and the links between a signature and what it signs.

The e2e backend's "pulp-ui-dev-signing" service can sign Ansible collections. It has no
container manifest signing service, so container signatures are left to component tests, as is
Debian (same embedded keys as RPM).

Pulp records an RPM's signing keys only when the package is uploaded or signed by Pulp; a synced
package has none recorded (not the same as unsigned). The seed therefore uploads a signed RPM
rather than syncing.

## RPM

### SIG-RPM-01 A package shows the key it was signed with

Summary: An uploaded signed RPM shows the key ID and fingerprint of the key Pulp recorded for it.

Seed: an RPM repository with one package uploaded from the signed RPM fixtures

When I open the repository's Content tab and select the package
Then the drawer's "Signatures" section shows the key ID and fingerprint of the key Pulp
recorded for it

## Ansible

### SIG-ANS-01 Signing a collection shows its signature

Summary: After "Sign collections" with a signing service, the collection version is marked "Signed", its signature names the service, and the signature links back to it.

Seed: an Ansible repository with an uploaded collection version

When I run "Sign collections" on the repository with "pulp-ui-dev-signing" and the task finishes
Then the collection's row in Browse shows "Signed"
And its drawer's "Signatures" section shows "Signed by" "pulp-ui-dev-signing"
When I choose "View signature"
Then the signature's page opens, and its "Signs" link opens the collection version's page

### SIG-ANS-02 Signatures are looked up where the details are shown

Summary: The drawer shows only signatures in the repository's version, while the content page shows every signature in the domain.

Seed: the same collection version in two Ansible repositories, signed in the first only

When I open the collection version's details from <where>
Then the "Signatures" section shows <shown>

| where                               | shown                                      |
| ----------------------------------- | ------------------------------------------ |
| the first repository's Content tab  | the signature                              |
| the second repository's Content tab | "No signatures in this repository version" |
| its content page                    | the signature                              |

## Python

### SIG-PY-01 A package shows its provenance

Summary: A Python package with a PEP 740 provenance is marked in Browse, shows its publisher, and the provenance page links back to the package.

Seed: a Python repository holding the uploaded sampleproject 4.0.0 wheel and its PyPI provenance

When I open the repository's Content tab
Then the package's row in Browse shows "Provenance"
When I select the package
Then the drawer's "Provenance" section shows "Publisher" "GitHub" and a "Repository" link
"pypa/sampleproject" to its GitHub page
When I choose "View provenance"
Then the provenance's page opens, and its "For" link opens the package's page
