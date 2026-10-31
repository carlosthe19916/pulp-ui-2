import {
  accessSection,
  descriptionField,
  distributionIdentity,
  distributionLabelsSection,
  servedRepositoryField,
  servedVersionField,
  sourceChoice,
} from "@app/plugin-forms/fragments";
import { distributionForm } from "@plugin-sdk/ui";

import { container } from "../../definition";

/** A container distribution serves a repository as a registry namespace. */
export const containerDistributionForm = distributionForm(
  container.distribution["container.container"],
)(({ f, s }) => ({
  title: {
    create: "Create container distribution",
    edit: "Edit container distribution",
  },
  docsUrl: "https://pulpproject.org/pulp_container/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      descriptionField(f),
      sourceChoice(f, ["repository", "repository_version"]),
      servedRepositoryField(f, {
        pulpTypes: ["container.container", "container.container-push"],
      }),
      servedVersionField(f, {
        pulpTypes: ["container.container", "container.container-push"],
      }),
      f.switch("private", {
        label: "Private",
        help: "Only users with access may pull images.",
      }),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));
