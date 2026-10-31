import { whenInstalled } from "../compose";
import type { IPluginDefinition, IRepositoryAction } from "../types";

const debActions: IRepositoryAction[] = [
  {
    key: "copy",
    label: "Advanced copy",
    path: "/deb/copy/",
    target: "repository",
    description:
      "Copies content between repositories as described by a config.",
  },
];

export const deb: IPluginDefinition = {
  app: { isAvailable: whenInstalled("deb", "pulp-deb") },
  // Repository is `deb.deb`; its remote/distribution/publication use distinct
  // pulp_types, overridden per slot below.
  rest: { pulpType: "deb.deb", apiPath: "deb/apt" },
  entities: {
    repository: {
      compatibleRemoteTypes: ["deb.apt-remote"],
      compatiblePublicationTypes: [
        "deb.apt-publication",
        "deb.verbatim-publication",
      ],
      contentChanges: "modify",
      archiveImport: false,
      actions: debActions,
    },

    remote: {
      rest: { pulpType: "deb.apt-remote" },
    },

    distribution: {
      rest: { pulpType: "deb.apt-distribution" },
    },

    // Two publication types: a structured APT publication and a verbatim mirror.
    publication: [
      {
        rest: { pulpType: "deb.apt-publication" },
      },
      {
        rest: { pulpType: "deb.verbatim-publication", apiPath: "deb/verbatim" },
      },
    ],
  },

  content: [
    {
      pulpType: "deb.package",
      apiPath: "deb/packages",
      uploadable: {
        mechanism: "create",
      },
    },
    {
      pulpType: "deb.generic",
      apiPath: "deb/generic_contents",
      uploadable: {
        mechanism: "create",
      },
    },
    {
      pulpType: "deb.installer_file_index",
      apiPath: "deb/installer_file_indices",
    },
    {
      pulpType: "deb.installer_package",
      apiPath: "deb/installer_packages",
      uploadable: {
        mechanism: "create",
      },
    },
    {
      pulpType: "deb.package_index",
      apiPath: "deb/package_indices",
    },
    {
      pulpType: "deb.package_release_component",
      apiPath: "deb/package_release_components",
    },
    { pulpType: "deb.release", apiPath: "deb/releases" },
    {
      pulpType: "deb.release_architecture",
      apiPath: "deb/release_architectures",
    },
    {
      pulpType: "deb.release_component",
      apiPath: "deb/release_components",
    },
    {
      pulpType: "deb.release_file",
      apiPath: "deb/release_files",
    },
    {
      pulpType: "deb.source_index",
      apiPath: "deb/source_indices",
    },
    {
      pulpType: "deb.source_package",
      apiPath: "deb/source_packages",
    },
    {
      pulpType: "deb.source_package_release_component",
      apiPath: "deb/source_release_components",
    },
  ],
};
