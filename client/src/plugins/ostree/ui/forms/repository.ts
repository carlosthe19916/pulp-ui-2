import {
  labelsSection,
  remoteField,
  repositoryIdentity,
  retentionSection,
} from "@app/forms/fragments";
import { repositoryForm } from "@plugin-sdk/ui";

import { ostree } from "../../definition";

/** An OSTree repository; static deltas speed up client updates. */
export const ostreeRepositoryForm = repositoryForm(
  ostree.repository["ostree.ostree"],
)(({ f, s }) => ({
  title: { create: "Create OSTree repository", edit: "Edit OSTree repository" },
  docsUrl: "https://pulpproject.org/pulp_ostree/",
  sections: [
    s.essentials([
      ...repositoryIdentity(f),
      remoteField(f),
      f.switch("compute_delta", {
        label: "Compute static deltas",
        defaultValue: true,
        help: "Generate deltas between commits so clients download less when updating.",
      }),
    ]),
    retentionSection({ f, s }),
    labelsSection({ f, s }),
  ],
}));
