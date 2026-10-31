import {
  accessSection,
  distributionIdentity,
  distributionLabelsSection,
  pullThroughRemoteField,
  servedRepositoryField,
  servedVersionField,
  sourceChoice,
} from "@app/forms/fragments";
import { distributionForm } from "@plugin-sdk/ui";

import { npm } from "../../definition";

/** Serves an npm repository or version, and can pull packages through a remote. */
export const npmDistributionForm = distributionForm(
  npm.distribution["npm.npm"],
)(({ f, s }) => ({
  title: { create: "Create npm distribution", edit: "Edit npm distribution" },
  docsUrl: "https://pulpproject.org/pulp_npm/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      sourceChoice(f, ["repository", "repository_version"]),
      servedRepositoryField(f, { pulpTypes: ["npm.npm"] }),
      servedVersionField(f, { pulpTypes: ["npm.npm"] }),
    ]),
    s.collapsible("pull-through", "Pull-through caching", [
      pullThroughRemoteField(f, { pulpTypes: ["npm.npm"] }),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));
