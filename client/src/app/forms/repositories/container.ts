import type {
  RepositoriesContainerContainerCreateData,
  RepositoriesContainerContainerPushPartialUpdateData,
} from "@app/client";

import {
  labelsSection,
  remoteField,
  repositoryIdentity,
  retentionSection,
  signingServiceField,
} from "../fragments/repository";
import { defineForm } from "../kit/defineForm";

/** A container repository mirrored from a registry through a remote. */
export const containerRepositoryForm = defineForm<
  RepositoriesContainerContainerCreateData["body"]
>()(({ f, s }) => ({
  title: {
    create: "Create container repository",
    edit: "Edit container repository",
  },
  docsUrl: "https://pulpproject.org/pulp_container/",
  sections: [
    s.essentials([...repositoryIdentity(f), remoteField(f)]),
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

/**
 * A push repository is created by pushing an image to the registry, so it has only an edit
 * form, typed from its update body.
 */
export const containerPushRepositoryForm = defineForm<
  NonNullable<RepositoriesContainerContainerPushPartialUpdateData["body"]>
>()(({ f, s }) => ({
  title: {
    create: "Create container push repository",
    edit: "Edit container push repository",
  },
  docsUrl: "https://pulpproject.org/pulp_container/",
  sections: [
    s.essentials(repositoryIdentity(f)),
    s.collapsible("signing", "Signing", [
      signingServiceField(f, "manifest_signing_service", {
        label: "Manifest signing service",
        help: "Signs image manifests pushed to the repository.",
      }),
    ]),
    retentionSection({ f, s }),
  ],
  // Labels change from the repository's page.
  omit: ["pulp_labels"],
}));
