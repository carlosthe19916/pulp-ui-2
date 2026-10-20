import {
  distributionBase,
  publicationBase,
  remoteBase,
  repositoryBase,
} from "../base-fields";
import { whenInstalled } from "../compose";
import type { IEntityField, IFieldOption } from "../field-types";
import type { IPluginDefinition } from "../types";

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
  { key: "content_guard", label: "Content Guard", type: "text" },
  {
    key: "generate_repo_config",
    label: "Generate Repo Config",
    type: "boolean",
  },
  { key: "checkpoint", label: "Checkpoint", type: "boolean" },
];

export const rpm: IPluginDefinition = {
  app: { isAvailable: whenInstalled("rpm", "pulp-rpm") },
  rest: { pulpType: "rpm.rpm", apiPath: "rpm/rpm" },
  entities: {
    // RPM repository: remotes, signing services and metadata layout options.
    repository: {
      form: {
        isWizard: false,
        createFields: [...repositoryBase.create, ...rpmRepositoryExtras],
        editFields: [...repositoryBase.edit, ...rpmRepositoryExtras],
      },
      compatibleRemoteTypes: ["rpm.rpm", "rpm.uln"],
      compatiblePublicationTypes: ["rpm.rpm"],
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

    // RPM distribution: repo/publication plus content-guard and repo-config options.
    distribution: {
      form: {
        isWizard: false,
        createFields: [...distributionBase.create, ...rpmDistributionExtras],
        editFields: [...distributionBase.edit, ...rpmDistributionExtras],
      },
    },

    // RPM publication: base supplies the repository; adds publish-time options.
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

  // RPM content types. Only identity is modelled now; `uploadable` fields are
  // authored in the upload phase.
  content: [
    { pulpType: "rpm.package", apiPath: "rpm/packages" },
    {
      pulpType: "rpm.advisory",
      apiPath: "rpm/advisories",
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
