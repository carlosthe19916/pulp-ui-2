import type {
  DistributionsContainerContainerCreateData,
  DistributionsContainerPullThroughCreateData,
} from "@app/client";

import { descriptionField } from "../fragments/base";
import {
  accessSection,
  distributionIdentity,
  distributionLabelsSection,
  pullThroughRemoteField,
  servedRepositoryField,
  servedVersionField,
  sourceChoice,
} from "../fragments/distribution";
import { defineForm } from "../kit/defineForm";

const privateField = {
  label: "Private",
  help: "Only users with access may pull images.",
};

/** A container distribution serves a repository as a registry namespace. */
export const containerDistributionForm = defineForm<
  DistributionsContainerContainerCreateData["body"]
>()(({ f, s }) => ({
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
      f.switch("private", privateField),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));

/** A pull-through distribution caches images from its remote's registry as clients pull. */
export const containerPullThroughDistributionForm = defineForm<
  DistributionsContainerPullThroughCreateData["body"]
>()(({ f, s }) => ({
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
        ...privateField,
        help: "Only users with access may pull images; distributions it creates inherit this.",
      }),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
  // Set by the cache: the repositories and distributions it creates as images are pulled.
  omit: ["repository", "repository_version", "distributions"],
}));
