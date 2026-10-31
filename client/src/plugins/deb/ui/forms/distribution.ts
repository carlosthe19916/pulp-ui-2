import {
  accessSection,
  CHECKPOINT_HELP,
  distributionIdentity,
  distributionLabelsSection,
  servedPublicationField,
  servedRepositoryField,
  servedVersionField,
  sourceChoice,
} from "@app/forms/fragments";
import { distributionForm } from "@plugin-sdk/ui";

import { deb } from "../../definition";

/** Serves an APT publication (structured or verbatim), a repository or one of its versions. */
export const debDistributionForm = distributionForm(
  deb.distribution["deb.apt-distribution"],
)(({ f, s }) => ({
  title: { create: "Create APT distribution", edit: "Edit APT distribution" },
  docsUrl: "https://pulpproject.org/pulp_deb/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      sourceChoice(f, ["publication", "repository", "repository_version"]),
      servedPublicationField(f, {
        pulpTypes: ["deb.apt-publication", "deb.verbatim-publication"],
      }),
      servedRepositoryField(f, { pulpTypes: ["deb.deb"] }),
      servedVersionField(f, { pulpTypes: ["deb.deb"] }),
    ]),
    s.collapsible("checkpoints", "Checkpoints", [
      f.switch("checkpoint", {
        label: "Checkpoint distribution",
        help: CHECKPOINT_HELP,
      }),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));
