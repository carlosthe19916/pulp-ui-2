import {
  authSection,
  connectionSections,
  nameField,
  POLICY_OPTIONS,
  policyField,
  SECTION_IDS,
  urlField,
} from "@app/forms/fragments";
import { remoteForm } from "@plugin-sdk/ui";

import { deb } from "../../definition";

/** An APT remote syncs Debian suites; which suites, components and architectures lead. */
export const debRemoteForm = remoteForm(deb.remote["deb.apt-remote"])(
  ({ f, s }) => ({
    title: { create: "Create APT remote", edit: "Edit APT remote" },
    docsUrl: "https://pulpproject.org/pulp_deb/",
    sections: [
      s.essentials([
        nameField(f),
        urlField(f, {
          help: "The repository root holding dists/, e.g. http://deb.debian.org/debian/.",
        }),
        // Pulp takes these as whitespace-separated strings.
        f.text("distributions", {
          label: "Distributions",
          required: true,
          placeholder: "bookworm bookworm-updates",
          help: "Space-separated suites to sync: the path from the repository root to each Release file.",
        }),
        f.row([
          f.text("components", {
            label: "Components",
            placeholder: "main contrib",
            help: "Space-separated. Empty syncs every component.",
          }),
          f.text("architectures", {
            label: "Architectures",
            placeholder: "amd64 arm64",
            help: "Space-separated. Empty syncs every architecture.",
          }),
        ]),
        policyField(f, [
          POLICY_OPTIONS.immediate,
          POLICY_OPTIONS.on_demand,
          POLICY_OPTIONS.streamed,
        ]),
      ]),
      s.collapsible("indices", "Package indices", [
        f.row([
          f.switch("sync_sources", { label: "Sync source packages" }),
          f.switch("sync_udebs", { label: "Sync installer packages (udebs)" }),
          f.switch("sync_installer", { label: "Sync installer files" }),
        ]),
        f.switch("ignore_missing_package_indices", {
          label: "Ignore missing package indices",
          help: "Sync even when a Release file declares indices the upstream doesn't serve.",
        }),
        f.stringList("excluded_package_metadata_fields", {
          label: "Excluded metadata fields",
          help: "Custom package metadata fields to drop while syncing.",
        }),
      ]),
      s.collapsible("signatures", "Signature verification", [
        f.code("gpgkey", {
          label: "GPG public key",
          language: "pem",
          downloadName: "release-key",
          help: "Verifies the upstream Release files. Empty skips verification.",
        }),
      ]),
      s.collapsible(SECTION_IDS.auth, "Authentication", authSection(f)),
      ...connectionSections({ f, s }),
    ],
  }),
);
