import {
  distributionBase,
  publicationBase,
  remoteBase,
  repositoryBase,
} from "../baseFields";
import { whenInstalled } from "../compose";
import type { IEntityField } from "../fieldTypes";
import type { IPluginDefinition, IRepositoryAction } from "../types";

/** Shared rest override for the PyPI variant (distribution + publication). */
const pypi = {
  rest: { pulpType: "python.pypi", apiPath: "python/pypi" },
};

const pythonRepositoryCreateExtras: IEntityField[] = [
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
  },
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
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
  },
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
    type: "asyncResource",
    resourceKind: "repository",
  },
  {
    key: "publication",
    label: "Publication",
    type: "asyncResource",
    resourceKind: "publication",
  },
  { key: "repository_version", label: "Repository Version", type: "text" },
  { key: "allow_uploads", label: "Allow Uploads", type: "boolean" },
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
  },
];

const pythonActions: IRepositoryAction[] = [
  {
    key: "repair-metadata",
    label: "Repair metadata",
    path: "repair_metadata/",
    target: "repository",
    description:
      "Repairs the metadata of every package without creating a new version.",
    fields: [],
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

export const python: IPluginDefinition = {
  app: { isAvailable: whenInstalled("python", "pulp-python") },
  rest: { pulpType: "python.python", apiPath: "python/python" },
  entities: {
    repository: {
      form: {
        isWizard: false,
        createFields: [
          ...repositoryBase.create,
          ...pythonRepositoryCreateExtras,
        ],
        editFields: [...repositoryBase.edit, ...pythonRepositoryEditExtras],
      },
      compatibleRemoteTypes: ["python.python"],
      compatiblePublicationTypes: ["python.pypi"],
      contentChanges: "modify",
      archiveImport: false,
      actions: pythonActions,
    },

    remote: {
      form: {
        isWizard: true,
        createFields: [...remoteBase.create, ...pythonRemoteExtras],
        editFields: [...remoteBase.edit, ...pythonRemoteExtras],
      },
    },

    distribution: {
      ...pypi,
      form: {
        isWizard: false,
        createFields: [...distributionBase.create, ...pythonDistributionExtras],
        editFields: [...distributionBase.edit, ...pythonDistributionExtras],
      },
    },

    publication: {
      ...pypi,
      form: {
        isWizard: false,
        createFields: [
          ...publicationBase.create,
          {
            key: "repository_version",
            label: "Repository Version",
            type: "text",
          },
        ],
        editFields: [],
      },
    },
  },

  content: [
    {
      pulpType: "python.python",
      apiPath: "python/packages",
      uploadable: { mechanism: "upload", fields: [] },
    },
    {
      pulpType: "python.provenance",
      apiPath: "python/provenance",
      uploadable: {
        mechanism: "create",
        fields: [
          {
            key: "package",
            label: "Package href",
            type: "text",
            required: true,
            helpText:
              "The pulp_href of the Python package this provenance is for.",
          },
        ],
      },
    },
    {
      pulpType: "python.python_yank",
      apiPath: "python/yanks",
    },
  ],
};
