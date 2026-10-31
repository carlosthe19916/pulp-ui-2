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

import { maven } from "../../definition";

/** Serves a Maven repository or version, and can pull artifacts through a remote. */
export const mavenDistributionForm = distributionForm(
  maven.distribution["maven.maven"],
)(({ f, s }) => ({
  title: {
    create: "Create Maven distribution",
    edit: "Edit Maven distribution",
  },
  docsUrl: "https://pulpproject.org/pulp_maven/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      sourceChoice(f, ["repository", "repository_version"]),
      servedRepositoryField(f, { pulpTypes: ["maven.maven"] }),
      servedVersionField(f, { pulpTypes: ["maven.maven"] }),
    ]),
    s.collapsible("pull-through", "Pull-through caching", [
      pullThroughRemoteField(f, { pulpTypes: ["maven.maven"] }),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));
