import {
  authSection,
  connectionSections,
  nameField,
  POLICY_OPTIONS,
  policyField,
  SECTION_IDS,
  urlField,
} from "@app/forms/fragments";
import { remoteForm } from "@plugin-sdk/ui";

import { huggingFace } from "../../definition";

/** A Hugging Face remote proxies models and datasets from a Hugging Face Hub. */
export const huggingFaceRemoteForm = remoteForm(
  huggingFace.remote["hugging_face.hugging-face"],
)(({ f, s }) => ({
  title: {
    create: "Create Hugging Face remote",
    edit: "Edit Hugging Face remote",
  },
  docsUrl: "https://pulpproject.org/pulp_hugging_face/",
  sections: [
    s.essentials([
      nameField(f),
      urlField(f, { help: "The Hub to proxy, e.g. https://huggingface.co." }),
      f.url("hf_hub_url", {
        label: "Hub API URL",
        defaultValue: "https://huggingface.co",
        help: "The base URL of the Hugging Face Hub API.",
      }),
      f.text("hf_token", {
        label: "Access token",
        help: "Needed for private or gated models and datasets.",
      }),
      policyField(f, [
        POLICY_OPTIONS.immediate,
        POLICY_OPTIONS.on_demand,
        POLICY_OPTIONS.streamed,
      ]),
    ]),
    s.collapsible(SECTION_IDS.auth, "Authentication", authSection(f)),
    ...connectionSections({ f, s }),
  ],
}));
