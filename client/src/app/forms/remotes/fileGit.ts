import type { RemotesFileGitCreateData } from "@app/client";

import { nameField, urlField } from "../fragments/base";
import { authSection, connectionSections } from "../fragments/remoteNetwork";
import { defineForm } from "../kit/defineForm";

/** A file Git remote syncs the files of a Git repository at one ref. */
export const fileGitRemoteForm = defineForm<RemotesFileGitCreateData["body"]>()(
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
      s.collapsible("auth", "Authentication", authSection(f)),
      ...connectionSections({ f, s }),
    ],
  }),
);
