import {
  labelsSection,
  remoteField,
  repositoryIdentity,
  retentionSection,
} from "@app/forms/fragments";
import { repositoryForm } from "@plugin-sdk/ui";

import { gem } from "../../definition";

/** A gem repository adds no settings of its own: identity, remote, retention and labels. */
export const gemRepositoryForm = repositoryForm(gem.repository["gem.gem"])(
  ({ f, s }) => ({
    title: { create: "Create gem repository", edit: "Edit gem repository" },
    docsUrl: "https://pulpproject.org/pulp_gem/",
    sections: [
      s.essentials([...repositoryIdentity(f), remoteField(f)]),
      retentionSection({ f, s }),
      labelsSection({ f, s }),
    ],
  }),
);
