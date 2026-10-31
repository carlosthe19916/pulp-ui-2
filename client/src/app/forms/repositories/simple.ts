import type {
  RepositoriesGemGemCreateData,
  RepositoriesHuggingFaceHuggingFaceCreateData,
  RepositoriesMavenMavenCreateData,
  RepositoriesNpmNpmCreateData,
} from "@app/client";

import {
  labelsSection,
  remoteField,
  repositoryIdentity,
  retentionSection,
} from "../fragments/repository";
import { defineForm } from "../kit/defineForm";

/**
 * Repositories whose plugins add no settings of their own: identity, remote, retention and
 * labels. Each is still its own definition, so a plugin can diverge without touching others.
 */

export const gemRepositoryForm = defineForm<
  RepositoriesGemGemCreateData["body"]
>()(({ f, s }) => ({
  title: { create: "Create gem repository", edit: "Edit gem repository" },
  docsUrl: "https://pulpproject.org/pulp_gem/",
  sections: [
    s.essentials([...repositoryIdentity(f), remoteField(f)]),
    retentionSection({ f, s }),
    labelsSection({ f, s }),
  ],
}));

export const npmRepositoryForm = defineForm<
  RepositoriesNpmNpmCreateData["body"]
>()(({ f, s }) => ({
  title: { create: "Create npm repository", edit: "Edit npm repository" },
  docsUrl: "https://pulpproject.org/pulp_npm/",
  sections: [
    s.essentials([...repositoryIdentity(f), remoteField(f)]),
    retentionSection({ f, s }),
    labelsSection({ f, s }),
  ],
}));

export const mavenRepositoryForm = defineForm<
  RepositoriesMavenMavenCreateData["body"]
>()(({ f, s }) => ({
  title: { create: "Create Maven repository", edit: "Edit Maven repository" },
  docsUrl: "https://pulpproject.org/pulp_maven/",
  sections: [
    s.essentials([...repositoryIdentity(f), remoteField(f)]),
    retentionSection({ f, s }),
    labelsSection({ f, s }),
  ],
}));

export const huggingFaceRepositoryForm = defineForm<
  RepositoriesHuggingFaceHuggingFaceCreateData["body"]
>()(({ f, s }) => ({
  title: {
    create: "Create Hugging Face repository",
    edit: "Edit Hugging Face repository",
  },
  docsUrl: "https://pulpproject.org/pulp_hugging_face/",
  sections: [
    s.essentials([...repositoryIdentity(f), remoteField(f)]),
    retentionSection({ f, s }),
    labelsSection({ f, s }),
  ],
}));
