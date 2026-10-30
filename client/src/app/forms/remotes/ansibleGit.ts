import type { RemotesAnsibleGitCreateData } from "@app/client";

import { nameField, urlField } from "../fragments/base";
import { authSection, connectionSections } from "../fragments/remoteNetwork";
import { defineForm } from "../kit/defineForm";

/** An Ansible Git remote builds a collection from a Git repository. */
export const ansibleGitRemoteForm = defineForm<
  RemotesAnsibleGitCreateData["body"]
>()(({ f, s }) => ({
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
    s.collapsible("auth", "Authentication", authSection(f)),
    ...connectionSections({ f, s }),
  ],
}));
