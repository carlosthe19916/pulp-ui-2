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

import { file } from "../../definition";

/** Serves a file repository, one of its versions, or a publication. */
export const fileDistributionForm = distributionForm(
  file.distribution["file.file"],
)(({ f, s }) => ({
  title: { create: "Create file distribution", edit: "Edit file distribution" },
  docsUrl: "https://pulpproject.org/pulp_file/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      sourceChoice(f, ["repository", "publication", "repository_version"]),
      servedRepositoryField(f, { pulpTypes: ["file.file"] }),
      servedPublicationField(f, { pulpTypes: ["file.file"] }),
      servedVersionField(f, { pulpTypes: ["file.file"] }),
    ]),
    checkpointSection({ f, s }),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));
