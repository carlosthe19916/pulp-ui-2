import type {
  DistributionsGemGemCreateData,
  DistributionsHuggingFaceHuggingFaceCreateData,
  DistributionsMavenMavenCreateData,
  DistributionsNpmNpmCreateData,
  DistributionsPythonPypiCreateData,
} from "@app/client";

import {
  accessSection,
  distributionIdentity,
  distributionLabelsSection,
  pullThroughRemoteField,
  servedPublicationField,
  servedRepositoryField,
  servedVersionField,
  sourceChoice,
} from "../fragments/distribution";
import { defineForm } from "../kit/defineForm";

/**
 * Distributions that can also pull content through a remote and cache it, besides serving a
 * repository (and, for some, a publication).
 */

export const pypiDistributionForm = defineForm<
  DistributionsPythonPypiCreateData["body"]
>()(({ f, s }) => ({
  title: { create: "Create PyPI distribution", edit: "Edit PyPI distribution" },
  docsUrl: "https://pulpproject.org/pulp_python/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      sourceChoice(f, ["repository", "publication", "repository_version"]),
      servedRepositoryField(f, { pulpTypes: ["python.python"] }),
      servedPublicationField(f, { pulpTypes: ["python.pypi"] }),
      servedVersionField(f, { pulpTypes: ["python.python"] }),
      f.switch("allow_uploads", {
        label: "Allow uploads",
        defaultValue: true,
        help: "Let clients upload packages to this index (twine upload).",
      }),
    ]),
    s.collapsible("pull-through", "Pull-through caching", [
      pullThroughRemoteField(f, { pulpTypes: ["python.python"] }),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));

export const gemDistributionForm = defineForm<
  DistributionsGemGemCreateData["body"]
>()(({ f, s }) => ({
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

export const npmDistributionForm = defineForm<
  DistributionsNpmNpmCreateData["body"]
>()(({ f, s }) => ({
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

export const mavenDistributionForm = defineForm<
  DistributionsMavenMavenCreateData["body"]
>()(({ f, s }) => ({
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

export const huggingFaceDistributionForm = defineForm<
  DistributionsHuggingFaceHuggingFaceCreateData["body"]
>()(({ f, s }) => ({
  title: {
    create: "Create Hugging Face distribution",
    edit: "Edit Hugging Face distribution",
  },
  docsUrl: "https://pulpproject.org/pulp_hugging_face/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      sourceChoice(f, ["repository", "publication", "repository_version"]),
      servedRepositoryField(f, { pulpTypes: ["hugging_face.hugging-face"] }),
      servedPublicationField(f, {
        pulpTypes: ["hugging_face.hugging-face"],
      }),
      servedVersionField(f, { pulpTypes: ["hugging_face.hugging-face"] }),
    ]),
    s.collapsible("pull-through", "Pull-through caching", [
      pullThroughRemoteField(f, { pulpTypes: ["hugging_face.hugging-face"] }),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));
