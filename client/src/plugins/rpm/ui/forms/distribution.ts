import {
  accessSection,
  checkpointSection,
  distributionIdentity,
  distributionLabelsSection,
  servedPublicationField,
  servedRepositoryField,
  servedVersionField,
  sourceChoice,
} from "@app/plugin-forms/fragments";
import { distributionForm } from "@plugin-sdk/ui";

import { rpm } from "../../definition";

/** Serves an RPM repository, one of its versions, or a publication. */
export const rpmDistributionForm = distributionForm(
  rpm.distribution["rpm.rpm"],
)(({ f, s }) => ({
  title: { create: "Create RPM distribution", edit: "Edit RPM distribution" },
  docsUrl: "https://pulpproject.org/pulp_rpm/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      sourceChoice(f, ["repository", "publication", "repository_version"]),
      servedRepositoryField(f, { pulpTypes: ["rpm.rpm"] }),
      servedPublicationField(f, { pulpTypes: ["rpm.rpm"] }),
      servedVersionField(f, { pulpTypes: ["rpm.rpm"] }),
      f.switch("generate_repo_config", {
        label: "Generate a .repo file",
        help: "Serve a config.repo clients can drop into /etc/yum.repos.d.",
      }),
    ]),
    checkpointSection({ f, s }),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));
