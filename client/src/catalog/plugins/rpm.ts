import {
  distributionBase,
  publicationBase,
  remoteBase,
  repositoryBase,
} from "../baseFields";
import { whenInstalled } from "../compose";
import type { IEntityField, IFieldOption } from "../fieldTypes";
import type { IPluginDefinition, IRepositoryAction } from "../types";

const CHECKSUM_TYPE_OPTIONS: IFieldOption[] = [
  { value: "unknown", label: "unknown" },
  { value: "md5", label: "md5" },
  { value: "sha1", label: "sha1" },
  { value: "sha224", label: "sha224" },
  { value: "sha256", label: "sha256" },
  { value: "sha384", label: "sha384" },
  { value: "sha512", label: "sha512" },
];

const COMPRESSION_TYPE_OPTIONS: IFieldOption[] = [
  { value: "zstd", label: "zstd" },
  { value: "gz", label: "gz" },
  { value: "none", label: "none" },
];

const LAYOUT_OPTIONS: IFieldOption[] = [
  { value: "nested_alphabetically", label: "Nested alphabetically" },
  { value: "flat", label: "Flat" },
  { value: "nested_by_digest", label: "Nested by digest" },
];

const rpmRepositoryExtras: IEntityField[] = [
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
  },
  { key: "autopublish", label: "Auto-publish", type: "boolean" },
  {
    key: "retain_package_versions",
    label: "Retain Package Versions",
    type: "number",
  },
  { key: "retain_checkpoints", label: "Retain Checkpoints", type: "number" },
  {
    key: "metadata_signing_service",
    label: "Metadata Signing Service",
    type: "text",
  },
  {
    key: "package_signing_service",
    label: "Package Signing Service",
    type: "text",
  },
  {
    key: "package_signing_fingerprint",
    label: "Package Signing Fingerprint",
    type: "text",
  },
  {
    key: "checksum_type",
    label: "Checksum Type",
    type: "select",
    options: CHECKSUM_TYPE_OPTIONS,
  },
  {
    key: "compression_type",
    label: "Compression Type",
    type: "select",
    options: COMPRESSION_TYPE_OPTIONS,
  },
  { key: "layout", label: "Layout", type: "select", options: LAYOUT_OPTIONS },
];

const rpmRemoteExtras: IEntityField[] = [
  {
    key: "sles_auth_token",
    label: "SLES Auth Token",
    type: "text",
    group: "Authentication",
  },
];

const rpmDistributionExtras: IEntityField[] = [
  {
    key: "repository",
    label: "Repository",
    type: "asyncResource",
    resourceKind: "repository",
  },
  {
    key: "publication",
    label: "Publication",
    type: "asyncResource",
    resourceKind: "publication",
  },
  {
    key: "generate_repo_config",
    label: "Generate Repo Config",
    type: "boolean",
  },
  { key: "checkpoint", label: "Checkpoint", type: "boolean" },
];

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
      form: {
        isWizard: false,
        createFields: [...repositoryBase.create, ...rpmRepositoryExtras],
        editFields: [...repositoryBase.edit, ...rpmRepositoryExtras],
      },
      compatibleRemoteTypes: ["rpm.rpm", "rpm.uln"],
      compatiblePublicationTypes: ["rpm.rpm"],
      contentChanges: "modify",
      archiveImport: false,
      actions: rpmActions,
    },

    // RPM remote (rpm.rpm) + ULN remote (rpm.uln) — two variants of the one slot.
    remote: [
      {
        form: {
          isWizard: true,
          createFields: [...remoteBase.create, ...rpmRemoteExtras],
          editFields: [...remoteBase.edit, ...rpmRemoteExtras],
        },
      },
      {
        rest: { pulpType: "rpm.uln", apiPath: "rpm/uln" },
        form: {
          isWizard: true,
          createFields: [
            ...remoteBase.create,
            {
              key: "uln_server_base_url",
              label: "ULN Server Base URL",
              type: "text",
              required: true,
              group: "General",
            },
          ],
          editFields: [
            ...remoteBase.edit,
            {
              key: "uln_server_base_url",
              label: "ULN Server Base URL",
              type: "text",
              group: "General",
            },
          ],
        },
      },
    ],

    distribution: {
      form: {
        isWizard: false,
        createFields: [...distributionBase.create, ...rpmDistributionExtras],
        editFields: [...distributionBase.edit, ...rpmDistributionExtras],
      },
    },

    publication: {
      form: {
        isWizard: false,
        createFields: [
          ...publicationBase.create,
          {
            key: "repository_version",
            label: "Repository Version",
            type: "text",
          },
          { key: "checkpoint", label: "Checkpoint", type: "boolean" },
          {
            key: "checksum_type",
            label: "Checksum Type",
            type: "select",
            options: CHECKSUM_TYPE_OPTIONS,
          },
          {
            key: "compression_type",
            label: "Compression Type",
            type: "select",
            options: COMPRESSION_TYPE_OPTIONS,
          },
          {
            key: "layout",
            label: "Layout",
            type: "select",
            options: LAYOUT_OPTIONS,
          },
        ],
        editFields: [],
      },
    },
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
