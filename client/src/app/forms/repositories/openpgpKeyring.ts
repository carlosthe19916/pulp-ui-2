import type { RepositoriesCoreOpenpgpKeyringCreateData } from "@app/client";

import {
  labelsSection,
  repositoryIdentity,
  retentionSection,
} from "../fragments/repository";
import { defineForm } from "../kit/defineForm";

/** An OpenPGP keyring holds public keys; keys are uploaded to it, never synced. */
export const openpgpKeyringRepositoryForm = defineForm<
  RepositoriesCoreOpenpgpKeyringCreateData["body"]
>()(({ f, s }) => ({
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
