import {
  CHECKPOINT,
  publicationSourceFields,
} from "@app/plugin-forms/fragments";
import { publicationForm } from "@plugin-sdk/ui";

import { rpm } from "../../definition";
import { rpmPublishingFields } from "./publishing";

/** Publishes an RPM repository's metadata; empty settings use the repository's. */
export const rpmPublicationForm = publicationForm(rpm.publication["rpm.rpm"])(
  ({ f, s }) => ({
    title: { create: "Create RPM publication", edit: "RPM publication" },
    docsUrl: "https://pulpproject.org/pulp_rpm/",
    sections: [
      s.essentials([
        ...publicationSourceFields(f, { pulpTypes: ["rpm.rpm"] }),
        f.switch("checkpoint", CHECKPOINT),
      ]),
      s.collapsible("publishing", "Publishing", rpmPublishingFields(f), {
        description: "Empty settings use the repository's.",
      }),
    ],
  }),
);
