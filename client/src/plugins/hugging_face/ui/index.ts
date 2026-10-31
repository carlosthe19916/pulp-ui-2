import { definePluginUi, lazyView } from "@plugin-sdk/ui";

import { huggingFace } from "../definition";
import { huggingFaceDistributionForm } from "./forms/distribution";
import { huggingFacePublicationForm } from "./forms/publication";
import { huggingFaceRemoteForm } from "./forms/remote";
import { huggingFaceRepositoryForm } from "./forms/repository";

const HUB = ["hugging_face.hugging-face"] as const;

export const huggingFaceUi = definePluginUi(huggingFace, {
  label: "Hugging Face",
  remote: { "hugging_face.hugging-face": { form: huggingFaceRemoteForm } },
  repository: {
    "hugging_face.hugging-face": {
      form: huggingFaceRepositoryForm,
      // The Hub's own navigation. All three share one content type, so no per-tab counts.
      browse: {
        sections: [
          {
            key: "models",
            title: "Models",
            pulpTypes: HUB,
            showCount: false,
            View: lazyView({
              load: () => import("./browse/HuggingFaceBrowse"),
              name: "HuggingFaceModels",
            }),
          },
          {
            key: "datasets",
            title: "Datasets",
            pulpTypes: HUB,
            showCount: false,
            View: lazyView({
              load: () => import("./browse/HuggingFaceBrowse"),
              name: "HuggingFaceDatasets",
            }),
          },
          {
            key: "spaces",
            title: "Spaces",
            pulpTypes: HUB,
            showCount: false,
            View: lazyView({
              load: () => import("./browse/HuggingFaceBrowse"),
              name: "HuggingFaceSpaces",
            }),
          },
        ],
      },
      tab: null,
    },
  },
  distribution: {
    "hugging_face.hugging-face": {
      form: huggingFaceDistributionForm,
      clientSetup: ({ baseUrl }) => ({
        hint: "Point the Hugging Face client at this endpoint.",
        code: `HF_ENDPOINT=${baseUrl} huggingface-cli download <repo_id>`,
      }),
    },
  },
  publication: {
    "hugging_face.hugging-face": { form: huggingFacePublicationForm },
  },
  content: {
    "hugging_face.hugging-face": {
      panel: lazyView({
        load: () => import("./content/HuggingFaceContent"),
        name: "HuggingFaceContent",
      }),
      search: null,
    },
  },
});
