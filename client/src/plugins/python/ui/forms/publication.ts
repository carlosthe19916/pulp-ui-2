import { publicationSourceFields } from "@app/plugin-forms/fragments";
import { publicationForm } from "@plugin-sdk/ui";

import { python } from "../../definition";

/** Publishes a Python repository as a PyPI simple index. */
export const pythonPublicationForm = publicationForm(
  python.publication["python.pypi"],
)(({ f, s }) => ({
  title: { create: "Create PyPI publication", edit: "PyPI publication" },
  docsUrl: "https://pulpproject.org/pulp_python/",
  sections: [
    s.essentials(publicationSourceFields(f, { pulpTypes: ["python.python"] })),
  ],
}));
