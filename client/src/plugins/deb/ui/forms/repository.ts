import {
  autopublishField,
  labelsSection,
  remoteField,
  repositoryIdentity,
  retentionSection,
  signingServiceField,
} from "@app/forms/fragments";
import { repositoryForm } from "@plugin-sdk/ui";

import { deb } from "../../definition";

/** An APT repository and how its Release files and packages are signed and published. */
export const debRepositoryForm = repositoryForm(deb.repository["deb.deb"])(
  ({ f, s }) => ({
    title: { create: "Create APT repository", edit: "Edit APT repository" },
    docsUrl: "https://pulpproject.org/pulp_deb/",
    sections: [
      s.essentials([
        ...repositoryIdentity(f),
        remoteField(f),
        autopublishField(f),
      ]),
      s.collapsible("signing", "Signing", [
        signingServiceField(f, "signing_service", {
          label: "Release signing service",
          help: "Signs Release files when a publication doesn't name its own signing service.",
        }),
        f.keyValue("signing_service_release_overrides", {
          label: "Release signing override",
          shape: "labels",
          help: "A signing service href per distribution (suite), e.g. bookworm → /pulp/api/v3/signing-services/…/.",
        }),
        f.row([
          signingServiceField(f, "package_signing_service", {
            label: "Package signing service",
          }),
          f.text("package_signing_fingerprint", {
            label: "Package signing fingerprint",
            placeholder: "v4:7FC42CD5F3D8EEC3…",
          }),
        ]),
        f.keyValue("package_signing_fingerprint_release_overrides", {
          label: "Package fingerprint override",
          shape: "labels",
          help: "A package signing fingerprint per distribution (suite).",
        }),
      ]),
      s.collapsible("publishing", "Publishing", [
        f.switch("publish_upstream_release_fields", {
          label: "Publish upstream Release fields",
          help: "Copy the upstream Release file's version, origin, label and description.",
        }),
        f.stringList("excluded_package_metadata_fields", {
          label: "Excluded metadata fields",
          help: "Package metadata fields to leave out of generated Packages indices.",
        }),
      ]),
      retentionSection({ f, s }),
      labelsSection({ f, s }),
    ],
  }),
);
