import {
  accessSection,
  descriptionField,
  distributionIdentity,
  distributionLabelsSection,
  pullThroughRemoteField,
} from "@app/forms/fragments";
import { distributionForm } from "@plugin-sdk/ui";

import { container } from "../../definition";

/** A pull-through distribution caches images from its remote's registry as clients pull. */
export const containerPullThroughDistributionForm = distributionForm(
  container.distribution["container.pull-through"],
)(({ f, s }) => ({
  title: {
    create: "Create container pull-through distribution",
    edit: "Edit container pull-through distribution",
  },
  docsUrl: "https://pulpproject.org/pulp_container/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      descriptionField(f),
      {
        ...pullThroughRemoteField(f, { pulpTypes: ["container.pull-through"] }),
        required: true,
      },
      f.switch("private", {
        label: "Private",
        help: "Only users with access may pull images; distributions it creates inherit this.",
      }),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
  // Set by the cache: the repositories and distributions it creates as images are pulled.
  omit: ["repository", "repository_version", "distributions"],
}));
