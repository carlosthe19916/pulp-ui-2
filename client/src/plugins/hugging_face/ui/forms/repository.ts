import {
  labelsSection,
  remoteField,
  repositoryIdentity,
  retentionSection,
} from "@app/plugin-forms/fragments";
import { repositoryForm } from "@plugin-sdk/ui";

import { huggingFace } from "../../definition";

/** A Hugging Face repository adds no settings of its own: identity, remote, retention and labels. */
export const huggingFaceRepositoryForm = repositoryForm(
  huggingFace.repository["hugging_face.hugging-face"],
)(({ f, s }) => ({
  title: {
    create: "Create Hugging Face repository",
    edit: "Edit Hugging Face repository",
  },
  docsUrl: "https://pulpproject.org/pulp_hugging_face/",
  sections: [
    s.essentials([
      ...repositoryIdentity(f),
      remoteField(f, {
        pulpTypes:
          huggingFace.repository["hugging_face.hugging-face"]
            .compatibleRemoteTypes,
      }),
    ]),
    retentionSection({ f, s }),
    labelsSection({ f, s }),
  ],
}));
