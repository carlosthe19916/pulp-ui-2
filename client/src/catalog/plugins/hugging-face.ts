import {
  distributionBase,
  publicationBase,
  remoteBase,
  repositoryBase,
} from "../baseFields";
import { whenInstalled } from "../compose";
import type { IEntityField } from "../fieldTypes";
import type { IPluginDefinition } from "../types";

const huggingFaceRepositoryExtras: IEntityField[] = [
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
  },
  { key: "retain_checkpoints", label: "Retained Checkpoints", type: "number" },
];

const huggingFaceRemoteExtras: IEntityField[] = [
  {
    key: "hf_hub_url",
    label: "Hugging Face Hub URL",
    type: "text",
    group: "General",
  },
  {
    key: "hf_token",
    label: "Hugging Face Token",
    type: "text",
    group: "Authentication",
  },
];

const huggingFaceDistributionExtras: IEntityField[] = [
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
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
  },
];

export const huggingFace: IPluginDefinition = {
  app: {
    isAvailable: whenInstalled(
      "hugging_face",
      "pulp-hugging-face",
      "pulp_hugging_face",
    ),
  },
  rest: {
    pulpType: "hugging_face.hugging-face",
    apiPath: "hugging_face/hugging-face",
  },
  entities: {
    repository: {
      form: {
        isWizard: false,
        createFields: [
          ...repositoryBase.create,
          ...huggingFaceRepositoryExtras,
        ],
        editFields: [...repositoryBase.edit, ...huggingFaceRepositoryExtras],
      },
      compatibleRemoteTypes: ["hugging_face.hugging-face"],
      compatiblePublicationTypes: ["hugging_face.hugging-face"],
      contentChanges: "modify",
      archiveImport: false,
    },

    remote: {
      form: {
        isWizard: true,
        createFields: [...remoteBase.create, ...huggingFaceRemoteExtras],
        editFields: [...remoteBase.edit, ...huggingFaceRemoteExtras],
      },
    },

    distribution: {
      form: {
        isWizard: false,
        createFields: [
          ...distributionBase.create,
          ...huggingFaceDistributionExtras,
        ],
        editFields: [
          ...distributionBase.edit,
          ...huggingFaceDistributionExtras,
        ],
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
        ],
        editFields: [],
      },
    },
  },

  content: [
    {
      pulpType: "hugging_face.hugging-face",
      apiPath: "hugging_face/hugging-face",
    },
  ],
};
