import type {
  DistributionsDebAptCreateData,
  DistributionsFileFileCreateData,
  DistributionsRpmRpmCreateData,
} from "@app/client";

import {
  accessSection,
  distributionIdentity,
  distributionLabelsSection,
  servedPublicationField,
  servedRepositoryField,
  servedVersionField,
  sourceChoice,
} from "../fragments/distribution";
import { defineForm } from "../kit/defineForm";

/** Distributions of published content: a repository, one of its versions, or a publication. */

const CHECKPOINT_HELP =
  "Serve the checkpoint publications of the source, browsable by date.";

export const fileDistributionForm = defineForm<
  DistributionsFileFileCreateData["body"]
>()(({ f, s }) => ({
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

export const rpmDistributionForm = defineForm<
  DistributionsRpmRpmCreateData["body"]
>()(({ f, s }) => ({
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

export const debDistributionForm = defineForm<
  DistributionsDebAptCreateData["body"]
>()(({ f, s }) => ({
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
