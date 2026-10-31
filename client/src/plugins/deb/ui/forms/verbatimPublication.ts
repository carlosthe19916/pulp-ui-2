import { publicationSourceFields } from "@app/forms/fragments";
import { publicationForm } from "@plugin-sdk/ui";

import { deb } from "../../definition";

/** A verbatim publication republishes the upstream files exactly as synced. */
export const debVerbatimPublicationForm = publicationForm(
  deb.publication["deb.verbatim-publication"],
)(({ f, s }) => ({
  title: {
    create: "Create verbatim APT publication",
    edit: "Verbatim APT publication",
  },
  docsUrl: "https://pulpproject.org/pulp_deb/",
  sections: [
    s.essentials(publicationSourceFields(f, { pulpTypes: ["deb.deb"] })),
  ],
}));
