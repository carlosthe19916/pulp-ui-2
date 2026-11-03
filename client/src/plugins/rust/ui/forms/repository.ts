import {
  labelsSection,
  remoteField,
  repositoryIdentity,
  retentionSection,
} from "@app/plugin-forms/fragments";
import { repositoryForm } from "@plugin-sdk/ui";

import { rust } from "../../definition";

/** A Rust repository adds no settings of its own: identity, remote, retention and labels. */
export const rustRepositoryForm = repositoryForm(rust.repository["rust.rust"])(
  ({ f, s }) => ({
    title: { create: "Create Rust repository", edit: "Edit Rust repository" },
    docsUrl: "https://pulpproject.org/pulp_rust/",
    sections: [
      s.essentials([
        ...repositoryIdentity(f),
        remoteField(f, {
          pulpTypes: rust.repository["rust.rust"].compatibleRemoteTypes,
        }),
      ]),
      retentionSection({ f, s }),
      labelsSection({ f, s }),
    ],
  }),
);
