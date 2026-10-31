import {
  labelsSection,
  remoteField,
  repositoryIdentity,
  retentionSection,
} from "@app/forms/fragments";
import { repositoryForm } from "@plugin-sdk/ui";

import { npm } from "../../definition";

/** An npm repository adds no settings of its own: identity, remote, retention and labels. */
export const npmRepositoryForm = repositoryForm(npm.repository["npm.npm"])(
  ({ f, s }) => ({
    title: { create: "Create npm repository", edit: "Edit npm repository" },
    docsUrl: "https://pulpproject.org/pulp_npm/",
    sections: [
      s.essentials([
        ...repositoryIdentity(f),
        remoteField(f, {
          pulpTypes: npm.repository["npm.npm"].compatibleRemoteTypes,
        }),
      ]),
      retentionSection({ f, s }),
      labelsSection({ f, s }),
    ],
  }),
);
