import {
  labelsSection,
  repositoryIdentity,
  retentionSection,
} from "@app/plugin-forms/fragments";
import { repositoryForm } from "@plugin-sdk/ui";

import { core } from "../../definition";

/** An OpenPGP keyring holds public keys; keys are uploaded to it, never synced. */
export const coreRepositoryForm = repositoryForm(
  core.repository["core.openpgp"],
)(({ f, s }) => ({
  title: {
    create: "Create OpenPGP keyring",
    edit: "Edit OpenPGP keyring",
  },
  docsUrl: "https://pulpproject.org/pulpcore/",
  sections: [
    s.essentials(repositoryIdentity(f)),
    retentionSection({ f, s }),
    labelsSection({ f, s }),
  ],
  // No remote type syncs keyrings: keys are uploaded.
  omit: ["remote"],
}));
