import {
  authSection,
  connectionSections,
  nameField,
  SECTION_IDS,
  urlField,
} from "@app/plugin-forms/fragments";
import { remoteForm } from "@plugin-sdk/ui";

import { ansible } from "../../definition";

/** An Ansible Git remote builds a collection from a Git repository. */
export const ansibleGitRemoteForm = remoteForm(ansible.remote["ansible.git"])(
  ({ f, s }) => ({
    title: {
      create: "Create Ansible Git remote",
      edit: "Edit Ansible Git remote",
    },
    docsUrl: "https://pulpproject.org/pulp_ansible/",
    sections: [
      s.essentials([
        nameField(f),
        urlField(f, {
          help: "The Git repository holding the collection, e.g. https://github.com/org/collection.git.",
        }),
        f.text("git_ref", {
          label: "Git ref",
          help: "The branch, tag or commit to build the collection from. Empty uses the default branch.",
        }),
        f.switch("metadata_only", {
          label: "Metadata only",
          help: "Store only the collection's metadata; clients download it from the Git repository.",
        }),
      ]),
      s.collapsible(SECTION_IDS.auth, "Authentication", authSection(f)),
      ...connectionSections({ f, s }),
    ],
  }),
);
