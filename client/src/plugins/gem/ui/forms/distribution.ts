import {
  accessSection,
  distributionIdentity,
  distributionLabelsSection,
  pullThroughRemoteField,
  servedPublicationField,
  servedRepositoryField,
  servedVersionField,
  sourceChoice,
} from "@app/plugin-forms/fragments";
import { distributionForm } from "@plugin-sdk/ui";

import { gem } from "../../definition";

/** Serves a gem repository, version or publication, and can pull gems through a remote. */
export const gemDistributionForm = distributionForm(
  gem.distribution["gem.gem"],
)(({ f, s }) => ({
  title: { create: "Create gem distribution", edit: "Edit gem distribution" },
  docsUrl: "https://pulpproject.org/pulp_gem/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      sourceChoice(f, ["repository", "publication", "repository_version"]),
      servedRepositoryField(f, { pulpTypes: ["gem.gem"] }),
      servedPublicationField(f, { pulpTypes: ["gem.gem"] }),
      servedVersionField(f, { pulpTypes: ["gem.gem"] }),
    ]),
    s.collapsible("pull-through", "Pull-through caching", [
      pullThroughRemoteField(f, { pulpTypes: ["gem.gem"] }),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));
