import type {
  DistributionsAnsibleAnsibleCreateData,
  DistributionsCoreOpenpgpCreateData,
  DistributionsOstreeOstreeCreateData,
} from "@app/client";

import {
  accessSection,
  distributionIdentity,
  distributionLabelsSection,
  servedRepositoryField,
  servedVersionField,
  sourceChoice,
} from "../fragments/distribution";
import { defineForm } from "../kit/defineForm";

/** Distributions that serve a repository or one of its versions, with no publications. */

export const ostreeDistributionForm = defineForm<
  DistributionsOstreeOstreeCreateData["body"]
>()(({ f, s }) => ({
  title: {
    create: "Create OSTree distribution",
    edit: "Edit OSTree distribution",
  },
  docsUrl: "https://pulpproject.org/pulp_ostree/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      sourceChoice(f, ["repository", "repository_version"]),
      servedRepositoryField(f, { pulpTypes: ["ostree.ostree"] }),
      servedVersionField(f, { pulpTypes: ["ostree.ostree"] }),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));

export const ansibleDistributionForm = defineForm<
  DistributionsAnsibleAnsibleCreateData["body"]
>()(({ f, s }) => ({
  title: {
    create: "Create Ansible distribution",
    edit: "Edit Ansible distribution",
  },
  docsUrl: "https://pulpproject.org/pulp_ansible/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      sourceChoice(f, ["repository", "repository_version"]),
      servedRepositoryField(f, { pulpTypes: ["ansible.ansible"] }),
      servedVersionField(f, { pulpTypes: ["ansible.ansible"] }),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));

export const openpgpDistributionForm = defineForm<
  DistributionsCoreOpenpgpCreateData["body"]
>()(({ f, s }) => ({
  title: {
    create: "Create OpenPGP keyring distribution",
    edit: "Edit OpenPGP keyring distribution",
  },
  docsUrl: "https://pulpproject.org/pulpcore/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      sourceChoice(f, ["repository", "repository_version"]),
      servedRepositoryField(f, { pulpTypes: ["core.openpgp"] }),
      servedVersionField(f, { pulpTypes: ["core.openpgp"] }),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));
