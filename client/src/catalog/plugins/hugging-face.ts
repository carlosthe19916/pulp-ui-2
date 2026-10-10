import {
  distributionBase,
  publicationBase,
  remoteBase,
  repositoryBase,
} from "../base-fields";
import { definePlugin, whenInstalled } from "../compose";
import type { IEntityField } from "../field-types";

const huggingFaceRepositoryExtras: IEntityField[] = [
  { key: "remote", label: "Remote", type: "resource", resourceKind: "remote" },
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
    type: "resource",
    resourceKind: "repository",
  },
  {
    key: "publication",
    label: "Publication",
    type: "resource",
    resourceKind: "publication",
  },
  { key: "remote", label: "Remote", type: "resource", resourceKind: "remote" },
];

export const huggingFace = definePlugin({
  app: {
    isAvailable: whenInstalled(
      "hugging_face",
      "pulp-hugging-face",
      "pulp_hugging_face",
    ),
  },
  ui: { label: "Hugging Face" },
  rest: {
    pulpType: "hugging_face.hugging-face",
    apiPath: "hugging_face/hugging-face",
  },
  entities: {
    // Hugging Face repository: a remote to sync from.
    repository: {
      capabilities: { sync: true, publish: true },
      form: {
        createFields: [
          ...repositoryBase.create,
          ...huggingFaceRepositoryExtras,
        ],
        editFields: [...repositoryBase.edit, ...huggingFaceRepositoryExtras],
      },
      page: {
        detailFields: [
          ...repositoryBase.detail,
          {
            key: "retain_checkpoints",
            label: "Retained Checkpoints",
            type: "number",
          },
        ],
      },
    },

    // Hugging Face remote: hub URL and token.
    remote: {
      isWizard: true,
      form: {
        createFields: [...remoteBase.create, ...huggingFaceRemoteExtras],
        editFields: [...remoteBase.edit, ...huggingFaceRemoteExtras],
      },
      page: {
        detailFields: [
          ...remoteBase.detail,
          { key: "hf_hub_url", label: "Hugging Face Hub URL", type: "text" },
        ],
      },
    },

    // Hugging Face distribution: serves a repository/publication, or pull-through.
    distribution: {
      form: {
        createFields: [
          ...distributionBase.create,
          ...huggingFaceDistributionExtras,
        ],
        editFields: [
          ...distributionBase.edit,
          ...huggingFaceDistributionExtras,
        ],
      },
      page: {
        detailFields: [
          ...distributionBase.detail,
          { key: "repository", label: "Repository", type: "text" },
          { key: "publication", label: "Publication", type: "text" },
          { key: "remote", label: "Remote", type: "text" },
        ],
        browseCardFields: [
          { key: "base_path", label: "Base path", type: "text" },
          { key: "base_url", label: "Base URL", type: "text" },
        ],
      },
    },

    // Hugging Face publication: base supplies the repository; adds repository_version.
    publication: {
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
