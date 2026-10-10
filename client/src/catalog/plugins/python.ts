import {
  distributionBase,
  publicationBase,
  remoteBase,
  repositoryBase,
} from "../base-fields";
import { definePlugin, whenInstalled } from "../compose";
import type { IEntityField } from "../field-types";

/** Shared ui + rest override for the PyPI variant (distribution + publication). */
const pypi = {
  ui: { label: "Python (PyPI)" },
  rest: { pulpType: "python.pypi", apiPath: "python/pypi" },
};

const pythonRepositoryCreateExtras: IEntityField[] = [
  { key: "remote", label: "Remote", type: "resource", resourceKind: "remote" },
  {
    key: "autopublish",
    label: "Auto-publish",
    type: "boolean",
    defaultValue: false,
  },
  { key: "retain_checkpoints", label: "Retained Checkpoints", type: "number" },
  {
    key: "allow_package_substitution",
    label: "Allow Package Substitution",
    type: "boolean",
  },
  { key: "error_on_reject", label: "Error on Reject", type: "boolean" },
];

const pythonRepositoryEditExtras: IEntityField[] = [
  { key: "remote", label: "Remote", type: "resource", resourceKind: "remote" },
  { key: "autopublish", label: "Auto-publish", type: "boolean" },
  { key: "retain_checkpoints", label: "Retained Checkpoints", type: "number" },
  {
    key: "allow_package_substitution",
    label: "Allow Package Substitution",
    type: "boolean",
  },
  { key: "error_on_reject", label: "Error on Reject", type: "boolean" },
];

const pythonRemoteExtras: IEntityField[] = [
  { key: "includes", label: "Includes", type: "textarea", group: "Advanced" },
  { key: "excludes", label: "Excludes", type: "textarea", group: "Advanced" },
  {
    key: "prereleases",
    label: "Prereleases",
    type: "boolean",
    group: "Advanced",
  },
  {
    key: "package_types",
    label: "Package Types",
    type: "text",
    group: "Advanced",
  },
  {
    key: "keep_latest_packages",
    label: "Keep Latest Packages",
    type: "number",
    group: "Advanced",
  },
  {
    key: "exclude_platforms",
    label: "Exclude Platforms",
    type: "text",
    group: "Advanced",
  },
  {
    key: "provenance",
    label: "Provenance",
    type: "boolean",
    group: "Advanced",
  },
];

const pythonDistributionExtras: IEntityField[] = [
  {
    key: "repository",
    label: "Repository",
    type: "resource",
    resourceKind: "repository",
  },
  {
    key: "publication",
    label: "Publication",
    type: "resource",
    resourceKind: "publication",
  },
  { key: "repository_version", label: "Repository Version", type: "text" },
  { key: "allow_uploads", label: "Allow Uploads", type: "boolean" },
  { key: "remote", label: "Remote", type: "resource", resourceKind: "remote" },
];

export const python = definePlugin({
  app: { isAvailable: whenInstalled("python", "pulp-python") },
  ui: { label: "Python" },
  rest: { pulpType: "python.python", apiPath: "python/python" },
  entities: {
    // Python repository: remote, auto-publish and package-substitution controls.
    repository: {
      capabilities: {
        sync: { remoteTypes: ["python.python"] },
        publish: true,
      },
      form: {
        createFields: [
          ...repositoryBase.create,
          ...pythonRepositoryCreateExtras,
        ],
        editFields: [...repositoryBase.edit, ...pythonRepositoryEditExtras],
      },
      page: {
        detailFields: [
          ...repositoryBase.detail,
          { key: "autopublish", label: "Auto-publish", type: "boolean" },
          {
            key: "retain_checkpoints",
            label: "Retained Checkpoints",
            type: "number",
          },
          {
            key: "allow_package_substitution",
            label: "Allow Package Substitution",
            type: "boolean",
          },
          { key: "error_on_reject", label: "Error on Reject", type: "boolean" },
        ],
      },
    },

    // Python remote: PyPI sync filters.
    remote: {
      isWizard: true,
      form: {
        createFields: [...remoteBase.create, ...pythonRemoteExtras],
        editFields: [...remoteBase.edit, ...pythonRemoteExtras],
      },
      page: {
        detailFields: [
          ...remoteBase.detail,
          { key: "includes", label: "Includes", type: "text" },
          { key: "excludes", label: "Excludes", type: "text" },
          { key: "prereleases", label: "Prereleases", type: "boolean" },
          { key: "package_types", label: "Package Types", type: "text" },
          {
            key: "keep_latest_packages",
            label: "Keep Latest Packages",
            type: "number",
          },
          {
            key: "exclude_platforms",
            label: "Exclude Platforms",
            type: "text",
          },
          { key: "provenance", label: "Provenance", type: "boolean" },
        ],
      },
    },

    // Python (PyPI) distribution: can also pull through an upstream via a remote.
    distribution: {
      ...pypi,
      form: {
        createFields: [...distributionBase.create, ...pythonDistributionExtras],
        editFields: [...distributionBase.edit, ...pythonDistributionExtras],
      },
      page: {
        detailFields: [
          ...distributionBase.detail,
          { key: "repository", label: "Repository", type: "text" },
          { key: "publication", label: "Publication", type: "text" },
          {
            key: "repository_version",
            label: "Repository Version",
            type: "text",
          },
          { key: "allow_uploads", label: "Allow Uploads", type: "boolean" },
          { key: "remote", label: "Remote", type: "text" },
        ],
        browseCardFields: [
          { key: "base_path", label: "Base path", type: "text" },
          { key: "base_url", label: "Base URL", type: "text" },
        ],
      },
    },

    // Python (PyPI) publication: base supplies the repository; adds repository_version.
    publication: {
      ...pypi,
      form: {
        createFields: [
          ...publicationBase.create,
          {
            key: "repository_version",
            label: "Repository Version",
            type: "text",
          },
        ],
      },
      page: { detailFields: publicationBase.detail },
    },
  },
});
