import { publicationSourceFields } from "@app/forms/fragments";
import { publicationForm } from "@plugin-sdk/ui";

import { huggingFace } from "../../definition";

/** Publishes a Hugging Face repository's latest or a chosen version. */
export const huggingFacePublicationForm = publicationForm(
  huggingFace.publication["hugging_face.hugging-face"],
)(({ f, s }) => ({
  title: {
    create: "Create Hugging Face publication",
    edit: "Hugging Face publication",
  },
  docsUrl: "https://pulpproject.org/pulp_hugging_face/",
  sections: [
    s.essentials(
      publicationSourceFields(f, { pulpTypes: ["hugging_face.hugging-face"] }),
    ),
  ],
}));
