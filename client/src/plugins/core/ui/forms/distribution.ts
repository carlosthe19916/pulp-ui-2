import {
  accessSection,
  distributionIdentity,
  distributionLabelsSection,
  servedRepositoryField,
  servedVersionField,
  sourceChoice,
} from "@app/forms/fragments";
import { distributionForm } from "@plugin-sdk/ui";

import { core } from "../../definition";

/** Serves an OpenPGP keyring or one of its versions. */
export const coreDistributionForm = distributionForm(
  core.distribution["core.openpgp"],
)(({ f, s }) => ({
  title: {
    create: "Create OpenPGP keyring distribution",
    edit: "Edit OpenPGP keyring distribution",
  },
  docsUrl: "https://pulpproject.org/pulpcore/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      sourceChoice(f, ["repository", "repository_version"]),
      servedRepositoryField(f, { pulpTypes: ["core.openpgp"] }),
      servedVersionField(f, { pulpTypes: ["core.openpgp"] }),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));
