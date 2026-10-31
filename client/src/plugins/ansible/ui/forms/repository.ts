import {
  labelsSection,
  remoteField,
  repositoryIdentity,
  retentionSection,
} from "@app/forms/fragments";
import { repositoryForm } from "@plugin-sdk/ui";

import { ansible } from "../../definition";

/** An Ansible repository, with the key its collection signatures are checked against. */
export const ansibleRepositoryForm = repositoryForm(
  ansible.repository["ansible.ansible"],
)(({ f, s }) => ({
  title: {
    create: "Create Ansible repository",
    edit: "Edit Ansible repository",
  },
  docsUrl: "https://pulpproject.org/pulp_ansible/",
  sections: [
    s.essentials([
      ...repositoryIdentity(f),
      remoteField(f),
      f.switch("private", {
        label: "Private",
        help: "Hide the repository's collections from users without access to it.",
      }),
    ]),
    s.collapsible("signatures", "Signature verification", [
      f.code("gpgkey", {
        label: "GPG public key",
        language: "pem",
        downloadName: "collection-signing-key",
        help: "Verifies the signatures of collections synced or uploaded to the repository.",
      }),
    ]),
    retentionSection({ f, s }),
    labelsSection({ f, s }),
  ],
  // Set by sync to track Galaxy changes; not a user setting.
  omit: ["last_synced_metadata_time"],
}));
