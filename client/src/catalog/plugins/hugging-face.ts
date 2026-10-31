import { whenInstalled } from "../compose";
import type { IPluginDefinition } from "../types";

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
      compatibleRemoteTypes: ["hugging_face.hugging-face"],
      compatiblePublicationTypes: ["hugging_face.hugging-face"],
      contentChanges: "modify",
      archiveImport: false,
      // pulp_hugging_face is read-only for RBAC: no per-object role endpoints.
      rolesManaged: false,
    },

    remote: {
      rolesManaged: false,
    },

    distribution: {
      rolesManaged: false,
    },

    publication: {
      rolesManaged: false,
    },
  },

  content: [
    {
      pulpType: "hugging_face.hugging-face",
      apiPath: "hugging_face/hugging-face",
    },
  ],
};
