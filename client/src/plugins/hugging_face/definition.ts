import { definePlugin } from "@plugin-sdk/definition";

/** Hugging Face: models, datasets and spaces mirrored from a Hub. */
export const huggingFace = definePlugin({
  id: "hugging_face",
  packages: ["hugging_face", "pulp-hugging-face", "pulp_hugging_face"],
  // pulp_hugging_face is read-only for RBAC: no per-object role endpoints.
  remote: {
    "hugging_face.hugging-face": {
      apiPath: "hugging_face/hugging-face",
      rolesManaged: false,
    },
  },
  repository: {
    "hugging_face.hugging-face": {
      apiPath: "hugging_face/hugging-face",
      compatibleRemoteTypes: ["hugging_face.hugging-face"],
      compatiblePublicationTypes: ["hugging_face.hugging-face"],
      contentChanges: "modify",
      rolesManaged: false,
    },
  },
  distribution: {
    "hugging_face.hugging-face": {
      apiPath: "hugging_face/hugging-face",
      rolesManaged: false,
    },
  },
  publication: {
    "hugging_face.hugging-face": {
      apiPath: "hugging_face/hugging-face",
      rolesManaged: false,
    },
  },
  content: {
    "hugging_face.hugging-face": { apiPath: "hugging_face/hugging-face" },
  },
});
