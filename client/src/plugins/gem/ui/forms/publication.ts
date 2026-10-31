import { publicationSourceFields } from "@app/plugin-forms/fragments";
import { publicationForm } from "@plugin-sdk/ui";

import { gem } from "../../definition";

/** Publishes a gem repository's latest or a chosen version. */
export const gemPublicationForm = publicationForm(gem.publication["gem.gem"])(
  ({ f, s }) => ({
    title: { create: "Create gem publication", edit: "Gem publication" },
    docsUrl: "https://pulpproject.org/pulp_gem/",
    sections: [
      s.essentials(publicationSourceFields(f, { pulpTypes: ["gem.gem"] })),
    ],
  }),
);
