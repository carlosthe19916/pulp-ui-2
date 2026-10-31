import {
  autopublishField,
  labelsSection,
  remoteField,
  repositoryIdentity,
  signingServiceField,
} from "@app/forms/fragments";
import { repositoryForm } from "@plugin-sdk/ui";

import { rpm } from "../../definition";

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
      s.collapsible("publishing", "Publishing", [
        f.row([
          f.select("checksum_type", {
            label: "Checksum type",
            options: [
              { value: "sha256", label: "SHA-256" },
              { value: "sha384", label: "SHA-384" },
              { value: "sha512", label: "SHA-512" },
              { value: "sha224", label: "SHA-224" },
              { value: "sha1", label: "SHA-1" },
            ],
          }),
          f.select("compression_type", {
            label: "Metadata compression",
            options: [
              { value: "zstd", label: "zstd" },
              { value: "gz", label: "gzip" },
              { value: "none", label: "None" },
            ],
          }),
          f.select("layout", {
            label: "Package layout",
            options: [
              {
                value: "nested_alphabetically",
                label: "Nested alphabetically",
              },
              { value: "nested_by_digest", label: "Nested by digest" },
              { value: "flat", label: "Flat" },
            ],
          }),
        ]),
        f.code("repo_config", {
          label: "Client repo config",
          language: "json",
          help: 'Options for the .repo file Pulp generates for clients, e.g. {"gpgcheck": 1}.',
        }),
      ]),
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
