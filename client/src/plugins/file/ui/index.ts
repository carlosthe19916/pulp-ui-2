import { relativePathField } from "@app/utils/entityFieldPresets";
import { definePluginUi, lazyViews } from "@plugin-sdk/ui";

import { file } from "../definition";
import { fileDistributionForm } from "./forms/distribution";
import { fileGitRemoteForm } from "./forms/gitRemote";
import { filePublicationForm } from "./forms/publication";
import { fileRemoteForm } from "./forms/remote";
import { fileRepositoryForm } from "./forms/repository";

const fileBrowse = lazyViews(() => import("./browse/FileBrowse"));
const fileContent = lazyViews(() => import("./content/FileContent"));

export const fileUi = definePluginUi({
  definition: file,
  ui: {
    label: "File",
    remote: {
      "file.file": { form: fileRemoteForm },
      "file.git": { label: "File (Git)", form: fileGitRemoteForm },
    },
    repository: {
      "file.file": {
        form: fileRepositoryForm,
        browse: {
          sections: [
            {
              key: "files",
              title: "Files",
              pulpTypes: ["file.file"],
              View: fileBrowse("FileFiles"),
            },
          ],
        },
        tab: null,
      },
    },
    distribution: {
      "file.file": {
        form: fileDistributionForm,
        clientSetup: ({ baseUrl }) => ({
          hint: "Download a file by its relative path.",
          code: `curl -O ${baseUrl}<relative_path>`,
        }),
      },
    },
    publication: { "file.file": { form: filePublicationForm } },
    content: {
      "file.file": {
        panel: fileContent("FileContent"),
        search: { param: "relative_path__contains", label: "path" },
        upload: [relativePathField({ required: true })],
      },
    },
  },
});
