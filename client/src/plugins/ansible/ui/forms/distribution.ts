import {
  accessSection,
  distributionIdentity,
  distributionLabelsSection,
  servedRepositoryField,
  servedVersionField,
  sourceChoice,
} from "@app/forms/fragments";
import { distributionForm } from "@plugin-sdk/ui";

import { ansible } from "../../definition";

/** Serves an Ansible repository or one of its versions; Ansible has no publications. */
export const ansibleDistributionForm = distributionForm(
  ansible.distribution["ansible.ansible"],
)(({ f, s }) => ({
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
