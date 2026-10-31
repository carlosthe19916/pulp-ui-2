import { CHECKPOINT, publicationSourceFields } from "@app/forms/fragments";
import { publicationForm } from "@plugin-sdk/ui";

import { file } from "../../definition";

/** Publishes a file repository with a manifest listing every file. */
export const filePublicationForm = publicationForm(
  file.publication["file.file"],
)(({ f, s }) => ({
  title: { create: "Create file publication", edit: "File publication" },
  docsUrl: "https://pulpproject.org/pulp_file/",
  sections: [
    s.essentials([
      ...publicationSourceFields(f, { pulpTypes: ["file.file"] }),
      f.switch("checkpoint", CHECKPOINT),
    ]),
    s.collapsible("publishing", "Publishing", [
      f.text("manifest", {
        label: "Manifest file name",
        defaultValue: "PULP_MANIFEST",
        help: "The name of the file listing every published file.",
      }),
    ]),
  ],
}));
