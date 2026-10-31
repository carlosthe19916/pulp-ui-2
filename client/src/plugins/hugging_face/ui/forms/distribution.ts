import {
  accessSection,
  distributionIdentity,
  distributionLabelsSection,
  pullThroughRemoteField,
  servedPublicationField,
  servedRepositoryField,
  servedVersionField,
  sourceChoice,
} from "@app/forms/fragments";
import { distributionForm } from "@plugin-sdk/ui";

import { huggingFace } from "../../definition";

/** Serves a Hugging Face repository, version or publication, and can pull through a remote. */
export const huggingFaceDistributionForm = distributionForm(
  huggingFace.distribution["hugging_face.hugging-face"],
)(({ f, s }) => ({
  title: {
    create: "Create Hugging Face distribution",
    edit: "Edit Hugging Face distribution",
  },
  docsUrl: "https://pulpproject.org/pulp_hugging_face/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      sourceChoice(f, ["repository", "publication", "repository_version"]),
      servedRepositoryField(f, { pulpTypes: ["hugging_face.hugging-face"] }),
      servedPublicationField(f, {
        pulpTypes: ["hugging_face.hugging-face"],
      }),
      servedVersionField(f, { pulpTypes: ["hugging_face.hugging-face"] }),
    ]),
    s.collapsible("pull-through", "Pull-through caching", [
      pullThroughRemoteField(f, { pulpTypes: ["hugging_face.hugging-face"] }),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));
