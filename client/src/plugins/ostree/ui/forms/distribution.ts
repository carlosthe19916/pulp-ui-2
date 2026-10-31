import {
  accessSection,
  distributionIdentity,
  distributionLabelsSection,
  servedRepositoryField,
  servedVersionField,
  sourceChoice,
} from "@app/forms/fragments";
import { distributionForm } from "@plugin-sdk/ui";

import { ostree } from "../../definition";

/** Serves an OSTree repository or one of its versions; OSTree has no publications. */
export const ostreeDistributionForm = distributionForm(
  ostree.distribution["ostree.ostree"],
)(({ f, s }) => ({
  title: {
    create: "Create OSTree distribution",
    edit: "Edit OSTree distribution",
  },
  docsUrl: "https://pulpproject.org/pulp_ostree/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      sourceChoice(f, ["repository", "repository_version"]),
      servedRepositoryField(f, { pulpTypes: ["ostree.ostree"] }),
      servedVersionField(f, { pulpTypes: ["ostree.ostree"] }),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));
