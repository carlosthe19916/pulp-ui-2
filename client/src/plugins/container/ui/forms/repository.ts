import {
  labelsSection,
  remoteField,
  repositoryIdentity,
  retentionSection,
  signingServiceField,
} from "@app/forms/fragments";
import { repositoryForm } from "@plugin-sdk/ui";

import { container } from "../../definition";

/** A container repository mirrored from a registry through a remote. */
export const containerRepositoryForm = repositoryForm(
  container.repository["container.container"],
)(({ f, s }) => ({
  title: {
    create: "Create container repository",
    edit: "Edit container repository",
  },
  docsUrl: "https://pulpproject.org/pulp_container/",
  sections: [
    s.essentials([
      ...repositoryIdentity(f),
      remoteField(f, {
        pulpTypes:
          container.repository["container.container"].compatibleRemoteTypes,
      }),
    ]),
    s.collapsible("signing", "Signing", [
      signingServiceField(f, "manifest_signing_service", {
        label: "Manifest signing service",
        help: "Signs image manifests added to the repository.",
      }),
    ]),
    retentionSection({ f, s }),
    labelsSection({ f, s }),
  ],
}));
