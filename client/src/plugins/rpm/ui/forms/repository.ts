import {
  autopublishField,
  labelsSection,
  remoteField,
  repositoryIdentity,
  signingServiceField,
} from "@app/forms/fragments";
import { repositoryForm } from "@plugin-sdk/ui";

import { rpm } from "../../definition";
import { rpmPublishingFields } from "./publishing";

/** An RPM repository: what it syncs from, how its metadata is published and signed. */
export const rpmRepositoryForm = repositoryForm(rpm.repository["rpm.rpm"])(
  ({ f, s }) => ({
    title: { create: "Create RPM repository", edit: "Edit RPM repository" },
    docsUrl: "https://pulpproject.org/pulp_rpm/",
    sections: [
      s.essentials([
        ...repositoryIdentity(f),
        remoteField(f),
        autopublishField(f),
      ]),
      s.collapsible("signing", "Signing", [
        signingServiceField(f, "metadata_signing_service", {
          label: "Metadata signing service",
          help: "Signs the repository metadata (repomd.xml) when publishing.",
        }),
        f.row([
          signingServiceField(f, "package_signing_service", {
            label: "Package signing service",
            help: "Signs packages as they are added.",
          }),
          f.text("package_signing_fingerprint", {
            label: "Package signing fingerprint",
            placeholder: "v4:7FC42CD5F3D8EEC3…",
            help: "The key the package signing service signs with.",
          }),
        ]),
      ]),
      s.collapsible("publishing", "Publishing", rpmPublishingFields(f)),
      s.collapsible("retention", "Retention", [
        f.row([
          f.number("retain_repo_versions", {
            label: "Retained versions",
            help: "How many of the newest versions to keep. Empty keeps all.",
          }),
          f.number("retain_package_versions", {
            label: "Retained package versions",
            help: "How many versions of each package to keep. 0 keeps all.",
          }),
          f.number("retain_checkpoints", {
            label: "Retained checkpoints",
            help: "How many checkpoint publications to keep. Empty keeps all.",
          }),
        ]),
      ]),
      s.collapsible("vulnerabilities", "Vulnerability scanning", [
        f.code("osv_config", {
          label: "OSV configuration",
          language: "json",
          help: 'A list of ecosystems to scan, each with a "name" and its "releases".',
        }),
      ]),
      labelsSection({ f, s }),
    ],
  }),
);
