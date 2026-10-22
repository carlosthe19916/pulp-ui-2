# Content list endpoints: generic vs typed

How a repository version's content is listed today (generic) and with one type selected (typed).
Both paths are under `/api/pulp/{domain}/api/v3/`. Every row also takes the version filter
`repository_version=<href>` (or `repository_version_added` / `repository_version_removed`).

- **Generic** (old): paging, `pulp_label_select`, `pulp_type__in`. Sorts only by `pk`.
- **Typed** (new): paging, `pulp_label_select`, `ordering=<field>`, and the type's own filters.
- **PR 1** ✅ = switches to the typed path in the current change (`TypedContentTable`).

| Type                                 | Generic path (old)                                            | Typed path (new)                                   | PR 1 |
| ------------------------------------ | ------------------------------------------------------------- | -------------------------------------------------- | ---- |
| **ansible**                          |                                                               |                                                    |      |
| ansible.collection_deprecation       | `content/?pulp_type__in=ansible.collection_deprecation`       | `content/ansible/collection_deprecations/`         |      |
| ansible.collection_mark              | `content/?pulp_type__in=ansible.collection_mark`              | `content/ansible/collection_marks/`                |      |
| ansible.collection_signature         | `content/?pulp_type__in=ansible.collection_signature`         | `content/ansible/collection_signatures/`           |      |
| ansible.collection_version           | `content/?pulp_type__in=ansible.collection_version`           | `content/ansible/collection_versions/`             | ✅   |
| ansible.namespace                    | `content/?pulp_type__in=ansible.namespace`                    | `content/ansible/namespaces/`                      |      |
| ansible.role                         | `content/?pulp_type__in=ansible.role`                         | `content/ansible/roles/`                           |      |
| **container**                        |                                                               |                                                    |      |
| container.blob                       | `content/?pulp_type__in=container.blob`                       | `content/container/blobs/`                         |      |
| container.manifest                   | `content/?pulp_type__in=container.manifest`                   | `content/container/manifests/`                     | ✅   |
| container.signature                  | `content/?pulp_type__in=container.signature`                  | `content/container/signatures/`                    |      |
| container.tag                        | `content/?pulp_type__in=container.tag`                        | `content/container/tags/`                          | ✅   |
| **rpm**                              |                                                               |                                                    |      |
| rpm.advisory                         | `content/?pulp_type__in=rpm.advisory`                         | `content/rpm/advisories/`                          |      |
| rpm.distribution_tree                | `content/?pulp_type__in=rpm.distribution_tree`                | `content/rpm/distribution_trees/`                  |      |
| rpm.modulemd                         | `content/?pulp_type__in=rpm.modulemd`                         | `content/rpm/modulemds/`                           |      |
| rpm.modulemd_defaults                | `content/?pulp_type__in=rpm.modulemd_defaults`                | `content/rpm/modulemd_defaults/`                   |      |
| rpm.modulemd_obsolete                | `content/?pulp_type__in=rpm.modulemd_obsolete`                | `content/rpm/modulemd_obsoletes/`                  |      |
| rpm.package                          | `content/?pulp_type__in=rpm.package`                          | `content/rpm/packages/`                            | ✅   |
| rpm.packagecategory                  | `content/?pulp_type__in=rpm.packagecategory`                  | `content/rpm/packagecategories/`                   |      |
| rpm.packageenvironment               | `content/?pulp_type__in=rpm.packageenvironment`               | `content/rpm/packageenvironments/`                 |      |
| rpm.packagegroup                     | `content/?pulp_type__in=rpm.packagegroup`                     | `content/rpm/packagegroups/`                       |      |
| rpm.packagelangpacks                 | `content/?pulp_type__in=rpm.packagelangpacks`                 | `content/rpm/packagelangpacks/`                    |      |
| rpm.repo_metadata_file               | `content/?pulp_type__in=rpm.repo_metadata_file`               | `content/rpm/repo_metadata_files/`                 |      |
| **deb**                              |                                                               |                                                    |      |
| deb.generic                          | `content/?pulp_type__in=deb.generic`                          | `content/deb/generic_contents/`                    |      |
| deb.installer_file_index             | `content/?pulp_type__in=deb.installer_file_index`             | `content/deb/installer_file_indices/`              |      |
| deb.installer_package                | `content/?pulp_type__in=deb.installer_package`                | `content/deb/installer_packages/`                  |      |
| deb.package                          | `content/?pulp_type__in=deb.package`                          | `content/deb/packages/`                            | ✅   |
| deb.package_index                    | `content/?pulp_type__in=deb.package_index`                    | `content/deb/package_indices/`                     |      |
| deb.package_release_component        | `content/?pulp_type__in=deb.package_release_component`        | `content/deb/package_release_components/`          |      |
| deb.release                          | `content/?pulp_type__in=deb.release`                          | `content/deb/releases/`                            |      |
| deb.release_architecture             | `content/?pulp_type__in=deb.release_architecture`             | `content/deb/release_architectures/`               |      |
| deb.release_component                | `content/?pulp_type__in=deb.release_component`                | `content/deb/release_components/`                  |      |
| deb.release_file                     | `content/?pulp_type__in=deb.release_file`                     | `content/deb/release_files/`                       |      |
| deb.source_index                     | `content/?pulp_type__in=deb.source_index`                     | `content/deb/source_indices/`                      |      |
| deb.source_package                   | `content/?pulp_type__in=deb.source_package`                   | `content/deb/source_packages/`                     |      |
| deb.source_package_release_component | `content/?pulp_type__in=deb.source_package_release_component` | `content/deb/source_release_components/`           |      |
| **python**                           |                                                               |                                                    |      |
| python.provenance                    | `content/?pulp_type__in=python.provenance`                    | `content/python/provenance/`                       |      |
| python.python                        | `content/?pulp_type__in=python.python`                        | `content/python/packages/`                         | ✅   |
| python.python_yank                   | `content/?pulp_type__in=python.python_yank`                   | `content/python/yanks/`                            |      |
| **file**                             |                                                               |                                                    |      |
| file.file                            | `content/?pulp_type__in=file.file`                            | `content/file/files/`                              | ✅   |
| **gem**                              |                                                               |                                                    |      |
| gem.gem                              | `content/?pulp_type__in=gem.gem`                              | `content/gem/gem/`                                 | ✅   |
| **npm**                              |                                                               |                                                    |      |
| npm.package                          | `content/?pulp_type__in=npm.package`                          | `content/npm/packages/`                            | ✅   |
| **maven**                            |                                                               |                                                    |      |
| maven.artifact                       | `content/?pulp_type__in=maven.artifact`                       | `content/maven/artifact/`                          | ✅   |
| maven.index-page                     | `content/?pulp_type__in=maven.index-page`                     | `content/maven/maven/index-page/` (not in catalog) |      |
| maven.metadata                       | `content/?pulp_type__in=maven.metadata`                       | `content/maven/metadata/`                          |      |
| maven.package                        | `content/?pulp_type__in=maven.package`                        | `content/maven/package/`                           |      |
| **ostree**                           |                                                               |                                                    |      |
| ostree.commit                        | `content/?pulp_type__in=ostree.commit`                        | `content/ostree/commits/`                          |      |
| ostree.config                        | `content/?pulp_type__in=ostree.config`                        | `content/ostree/configs/`                          |      |
| ostree.content                       | `content/?pulp_type__in=ostree.content`                       | `content/ostree/content/`                          |      |
| ostree.object                        | `content/?pulp_type__in=ostree.object`                        | `content/ostree/objects/`                          |      |
| ostree.refs                          | `content/?pulp_type__in=ostree.refs`                          | `content/ostree/refs/`                             |      |
| ostree.summary                       | `content/?pulp_type__in=ostree.summary`                       | `content/ostree/summaries/`                        |      |
| **hugging_face**                     |                                                               |                                                    |      |
| hugging_face.hugging-face            | `content/?pulp_type__in=hugging_face.hugging-face`            | `content/hugging_face/hugging-face/`               |      |
| **core**                             |                                                               |                                                    |      |
| core.openpgp_publickey               | `content/?pulp_type__in=core.openpgp_publickey`               | `content/core/openpgp_publickey/`                  |      |
| core.openpgp_publicsubkey            | `content/?pulp_type__in=core.openpgp_publicsubkey`            | `content/core/openpgp_publicsubkey/`               |      |
| core.openpgp_signature               | `content/?pulp_type__in=core.openpgp_signature`               | `content/core/openpgp_signature/`                  |      |
| core.openpgp_userattribute           | `content/?pulp_type__in=core.openpgp_userattribute`           | `content/core/openpgp_userattribute/`              |      |
| core.openpgp_userid                  | `content/?pulp_type__in=core.openpgp_userid`                  | `content/core/openpgp_userid/`                     |      |
| core.publishedmetadata               | `content/?pulp_type__in=core.publishedmetadata`               | — (generic only)                                   |      |
