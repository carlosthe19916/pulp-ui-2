import { definePlugin } from "@plugin-sdk/definition";

/**
 * Debian: the repository is `deb.deb`; its remote, distribution and publications use their own
 * pulp_types. A repository publishes structured (APT) or verbatim (a mirror of upstream).
 */
export const deb = definePlugin({
  id: "deb",
  packages: ["deb", "pulp-deb"],
  remote: { "deb.apt-remote": { apiPath: "deb/apt" } },
  repository: {
    "deb.deb": {
      apiPath: "deb/apt",
      compatibleRemoteTypes: ["deb.apt-remote"],
      compatiblePublicationTypes: [
        "deb.apt-publication",
        "deb.verbatim-publication",
      ],
      contentChanges: "modify",
      actions: { copy: { path: "/deb/copy/", target: "repository" } },
    },
  },
  distribution: { "deb.apt-distribution": { apiPath: "deb/apt" } },
  publication: {
    "deb.apt-publication": { apiPath: "deb/apt" },
    "deb.verbatim-publication": { apiPath: "deb/verbatim" },
  },
  content: {
    "deb.package": { apiPath: "deb/packages", upload: "create" },
    "deb.generic": { apiPath: "deb/generic_contents", upload: "create" },
    "deb.installer_file_index": { apiPath: "deb/installer_file_indices" },
    "deb.installer_package": {
      apiPath: "deb/installer_packages",
      upload: "create",
    },
    "deb.package_index": { apiPath: "deb/package_indices" },
    "deb.package_release_component": {
      apiPath: "deb/package_release_components",
    },
    "deb.release": { apiPath: "deb/releases" },
    "deb.release_architecture": { apiPath: "deb/release_architectures" },
    "deb.release_component": { apiPath: "deb/release_components" },
    "deb.release_file": { apiPath: "deb/release_files" },
    "deb.source_index": { apiPath: "deb/source_indices" },
    "deb.source_package": { apiPath: "deb/source_packages" },
    "deb.source_package_release_component": {
      apiPath: "deb/source_release_components",
    },
  },
  acs: { apiPath: "deb/deb", remoteType: "deb.apt-remote" },
});
