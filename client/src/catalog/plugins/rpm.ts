import { whenInstalled } from "../compose";
import type { IPluginDefinition, IRepositoryAction } from "../types";

const copyConfigHelp =
  'A list of {"source_repo_version", "dest_repo", "content"} entries.';

const rpmActions: IRepositoryAction[] = [
  {
    key: "copy",
    label: "Advanced copy",
    path: "/rpm/copy/",
    target: "repository",
    description:
      "Copies content and its dependencies between repositories as described by a config.",
    fields: [
      {
        key: "config",
        label: "Config",
        type: "json",
        required: true,
        helpText: copyConfigHelp,
      },
    ],
  },
  {
    key: "comps",
    label: "Upload comps.xml",
    path: "/rpm/comps/",
    target: "repository",
    repositoryParam: { key: "repository" },
    fields: [
      { key: "file", label: "comps.xml", type: "file", required: true },
      {
        key: "replace",
        label: "Replace existing comps content",
        type: "boolean",
      },
    ],
  },
  {
    key: "prune",
    label: "Prune packages",
    path: "/rpm/prune/",
    target: "repository",
    repositoryParam: { key: "repo_hrefs", list: true },
    description: "Removes all but the newest version of each package.",
    fields: [
      {
        key: "keep_days",
        label: "Keep days",
        type: "number",
        defaultValue: 14,
        helpText: "Prune packages introduced before this many days ago.",
      },
      { key: "dry_run", label: "Dry run", type: "boolean" },
    ],
  },
  {
    key: "scan",
    label: "Scan for vulnerabilities",
    path: "scan/",
    target: "version",
    description:
      "Checks this version's packages against known vulnerabilities and stores a report.",
    fields: [],
  },
];

export const rpm: IPluginDefinition = {
  app: { isAvailable: whenInstalled("rpm", "pulp-rpm") },
  rest: { pulpType: "rpm.rpm", apiPath: "rpm/rpm" },
  entities: {
    repository: {
      compatibleRemoteTypes: ["rpm.rpm", "rpm.uln"],
      compatiblePublicationTypes: ["rpm.rpm"],
      contentChanges: "modify",
      archiveImport: false,
      actions: rpmActions,
    },

    // RPM remote (rpm.rpm) + ULN remote (rpm.uln) — two variants of the one slot.
    remote: [
      {},
      {
        rest: { pulpType: "rpm.uln", apiPath: "rpm/uln" },
      },
    ],

    distribution: {},

    publication: {},
  },

  // RPM content types: packages upload synchronously; an advisory uploads its JSON.
  content: [
    {
      pulpType: "rpm.package",
      apiPath: "rpm/packages",
      uploadable: { mechanism: "upload", fields: [] },
    },
    {
      pulpType: "rpm.advisory",
      apiPath: "rpm/advisories",
      uploadable: { mechanism: "create", fields: [] },
    },
    { pulpType: "rpm.modulemd", apiPath: "rpm/modulemds" },
    {
      pulpType: "rpm.modulemd_defaults",
      apiPath: "rpm/modulemd_defaults",
    },
    {
      pulpType: "rpm.modulemd_obsolete",
      apiPath: "rpm/modulemd_obsoletes",
    },
    {
      pulpType: "rpm.packagecategory",
      apiPath: "rpm/packagecategories",
    },
    {
      pulpType: "rpm.packageenvironment",
      apiPath: "rpm/packageenvironments",
    },
    {
      pulpType: "rpm.packagegroup",
      apiPath: "rpm/packagegroups",
    },
    {
      pulpType: "rpm.packagelangpacks",
      apiPath: "rpm/packagelangpacks",
    },
    {
      pulpType: "rpm.distribution_tree",
      apiPath: "rpm/distribution_trees",
    },
    {
      pulpType: "rpm.repo_metadata_file",
      apiPath: "rpm/repo_metadata_files",
    },
  ],
};
