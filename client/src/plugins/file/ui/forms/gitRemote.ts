import {
  authSection,
  connectionSections,
  nameField,
  SECTION_IDS,
  urlField,
} from "@app/forms/fragments";
import { remoteForm } from "@plugin-sdk/ui";

import { file } from "../../definition";

/** A file Git remote syncs the files of a Git repository at one ref. */
export const fileGitRemoteForm = remoteForm(file.remote["file.git"])(
  ({ f, s }) => ({
    title: { create: "Create file Git remote", edit: "Edit file Git remote" },
    docsUrl: "https://pulpproject.org/pulp_file/",
    sections: [
      s.essentials([
        nameField(f),
        urlField(f, {
          help: "The Git repository to clone, e.g. https://github.com/org/repo.git.",
        }),
        f.text("git_ref", {
          label: "Git ref",
          defaultValue: "HEAD",
          help: "The branch, tag or commit to sync.",
        }),
      ]),
      s.collapsible(SECTION_IDS.auth, "Authentication", authSection(f)),
      ...connectionSections({ f, s }),
    ],
  }),
);
