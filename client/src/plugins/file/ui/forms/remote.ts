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

import { file } from "../../definition";

/** A file remote syncs the files listed in a `PULP_MANIFEST`. */
export const fileRemoteForm = remoteForm(file.remote["file.file"])(
  ({ f, s }) => ({
    title: { create: "Create file remote", edit: "Edit file remote" },
    docsUrl: "https://pulpproject.org/pulp_file/",
    sections: [
      s.essentials([
        nameField(f),
        urlField(f, {
          help: "The URL of the PULP_MANIFEST that lists the files to sync, e.g. https://example.com/files/PULP_MANIFEST.",
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
  }),
);
