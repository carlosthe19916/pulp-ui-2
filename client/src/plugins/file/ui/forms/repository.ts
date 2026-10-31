import {
  autopublishField,
  labelsSection,
  remoteField,
  repositoryIdentity,
  retentionSection,
} from "@app/plugin-forms/fragments";
import { repositoryForm } from "@plugin-sdk/ui";

import { file } from "../../definition";

/** A file repository holds arbitrary files, published with a PULP_MANIFEST. */
export const fileRepositoryForm = repositoryForm(file.repository["file.file"])(
  ({ f, s }) => ({
    title: { create: "Create file repository", edit: "Edit file repository" },
    docsUrl: "https://pulpproject.org/pulp_file/",
    sections: [
      s.essentials([
        ...repositoryIdentity(f),
        remoteField(f, {
          pulpTypes: file.repository["file.file"].compatibleRemoteTypes,
        }),
        autopublishField(f),
      ]),
      s.collapsible("publishing", "Publishing", [
        f.text("manifest", {
          label: "Manifest file name",
          defaultValue: "PULP_MANIFEST",
          help: "The name of the file listing every file in a publication.",
        }),
      ]),
      retentionSection({ f, s }),
      labelsSection({ f, s }),
    ],
  }),
);
