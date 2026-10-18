import {
  distributionBase,
  publicationBase,
  remoteBase,
  repositoryBase,
} from "../base-fields";
import { whenInstalled } from "../compose";
import type { IEntityField, IFieldOption } from "../field-types";
import type { IPluginDefinition } from "../types";

const LAYOUT_OPTIONS: IFieldOption[] = [
  { value: "by_hash", label: "By hash" },
  { value: "flat", label: "Flat" },
];

const debRepositoryExtras: IEntityField[] = [
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
  },
  { key: "autopublish", label: "Auto-publish", type: "boolean" },
  {
    key: "publish_upstream_release_fields",
    label: "Publish Upstream Release Fields",
    type: "boolean",
  },
  { key: "signing_service", label: "Signing Service", type: "text" },
  {
    key: "excluded_package_metadata_fields",
    label: "Excluded Package Metadata Fields",
    type: "textarea",
  },
];

const debRemoteExtras: IEntityField[] = [
  {
    key: "distributions",
    label: "Distributions",
    type: "text",
    required: true,
    group: "General",
  },
  { key: "components", label: "Components", type: "text", group: "General" },
  {
    key: "architectures",
    label: "Architectures",
    type: "text",
    group: "General",
  },
  { key: "sync_sources", label: "Sync Sources", type: "boolean" },
  { key: "sync_udebs", label: "Sync Installer Packages", type: "boolean" },
  { key: "sync_installer", label: "Sync Installer Files", type: "boolean" },
  { key: "gpgkey", label: "GPG Key", type: "textarea" },
  {
    key: "ignore_missing_package_indices",
    label: "Ignore Missing Package Indices",
    type: "boolean",
  },
  {
    key: "excluded_package_metadata_fields",
    label: "Excluded Package Metadata Fields",
    type: "textarea",
  },
];

const debDistributionExtras: IEntityField[] = [
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
  { key: "checkpoint", label: "Checkpoint", type: "boolean" },
];

export const deb: IPluginDefinition = {
  app: { isAvailable: whenInstalled("deb", "pulp-deb") },
  ui: { label: "Deb" },
  // Repository is `deb.deb`; its remote/distribution/publication use distinct
  // pulp_types, overridden per slot below.
  rest: { pulpType: "deb.deb", apiPath: "deb/apt" },
  entities: {
    // APT repository: a remote to sync from, auto-publish and signing options.
    repository: {
      form: {
        isWizard: false,
        createFields: [...repositoryBase.create, ...debRepositoryExtras],
        editFields: [...repositoryBase.edit, ...debRepositoryExtras],
      },
      compatibleRemoteTypes: ["deb.apt-remote"],
      compatiblePublicationTypes: [
        "deb.apt-publication",
        "deb.verbatim-publication",
      ],
    },

    // APT remote (deb.apt-remote): release filters and sync toggles.
    remote: {
      ui: {},
      rest: { pulpType: "deb.apt-remote" },
      form: {
        isWizard: true,
        createFields: [...remoteBase.create, ...debRemoteExtras],
        editFields: [...remoteBase.edit, ...debRemoteExtras],
      },
    },

    // APT distribution (deb.apt-distribution): serves a repository/publication.
    distribution: {
      ui: {},
      rest: { pulpType: "deb.apt-distribution" },
      form: {
        isWizard: false,
        createFields: [...distributionBase.create, ...debDistributionExtras],
        editFields: [...distributionBase.edit, ...debDistributionExtras],
      },
    },

    // Two publication types: a structured APT publication and a verbatim mirror.
    publication: [
      {
        ui: { label: "APT" },
        rest: { pulpType: "deb.apt-publication" },
        form: {
          isWizard: false,
          createFields: [
            ...publicationBase.create,
            { key: "structured", label: "Structured", type: "boolean" },
            { key: "simple", label: "Simple", type: "boolean" },
            { key: "signing_service", label: "Signing Service", type: "text" },
            { key: "checkpoint", label: "Checkpoint", type: "boolean" },
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
      {
        ui: { label: "Verbatim" },
        rest: { pulpType: "deb.verbatim-publication", apiPath: "deb/verbatim" },
        form: {
          isWizard: false,
          createFields: publicationBase.create,
          editFields: [],
        },
      },
    ],
  },
};
