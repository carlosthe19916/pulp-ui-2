import {
  distributionBase,
  publicationBase,
  remoteBase,
  repositoryBase,
} from "../base-fields";
import { whenInstalled } from "../compose";
import type { IEntityField } from "../field-types";
import type { IPluginDefinition } from "../types";

const fileDistributionExtras: IEntityField[] = [
  {
    key: "repository",
    label: "Repository",
    type: "asyncResource",
    resourceKind: "repository",
  },
  {
    key: "publication",
    label: "Publication",
    type: "asyncResource",
    resourceKind: "publication",
  },
];

/** FileGitRemote forces policy=immediate server-side (HiddenField), so drop it. */
const withoutPolicy = (fields: IEntityField[]): IEntityField[] =>
  fields.filter((field) => field.key !== "policy");

const fileGitRemoteExtras: IEntityField[] = [
  {
    key: "git_ref",
    label: "Git Ref",
    type: "text",
    defaultValue: "HEAD",
    group: "General",
  },
];

/** File: the pulpcore reference plugin — implements all five entity types. */
export const file: IPluginDefinition = {
  app: { isAvailable: whenInstalled("file", "pulp-file") },
  rest: { pulpType: "file.file", apiPath: "file/file" },
  entities: {
    // File repository: a remote to sync from plus auto-publish.
    repository: {
      form: {
        isWizard: false,
        createFields: [
          ...repositoryBase.create,
          {
            key: "remote",
            label: "Remote",
            type: "asyncResource",
            resourceKind: "remote",
          },
          {
            key: "autopublish",
            label: "Auto-publish",
            type: "boolean",
            defaultValue: false,
          },
        ],
        editFields: [
          ...repositoryBase.edit,
          {
            key: "remote",
            label: "Remote",
            type: "asyncResource",
            resourceKind: "remote",
          },
          { key: "autopublish", label: "Auto-publish", type: "boolean" },
        ],
      },
      compatibleRemoteTypes: ["file.file", "file.git"],
      compatiblePublicationTypes: ["file.file"],
      contentChanges: "modify",
      archiveImport: false,
    },

    // File remote (file.file) + Git remote (file.git) — two variants of the slot.
    // A FileRepository's backend REMOTE_TYPES is [FileRemote, FileGitRemote], so
    // both can be synced from; declaring the git variant here lets the sync UI
    // offer it and lets users create one.
    remote: [
      {
        form: {
          isWizard: true,
          createFields: remoteBase.create,
          editFields: remoteBase.edit,
        },
      },
      {
        rest: { pulpType: "file.git", apiPath: "file/git" },
        form: {
          isWizard: true,
          createFields: [
            ...withoutPolicy(remoteBase.create),
            ...fileGitRemoteExtras,
          ],
          editFields: [
            ...withoutPolicy(remoteBase.edit),
            ...fileGitRemoteExtras,
          ],
        },
      },
    ],

    // File distribution: serves a repository or a specific publication.
    distribution: {
      form: {
        isWizard: false,
        createFields: [...distributionBase.create, ...fileDistributionExtras],
        editFields: [...distributionBase.edit, ...fileDistributionExtras],
      },
    },

    // File publication: base supplies the repository; adds repository_version.
    publication: {
      form: {
        isWizard: false,
        createFields: [
          ...publicationBase.create,
          {
            key: "repository_version",
            label: "Repository Version",
            type: "text",
          },
        ],
        editFields: [],
      },
    },
  },

  // File content: one uploadable type. The collection path (file/files) differs
  // from the pulp_type (file.file).
  content: [
    {
      pulpType: "file.file",
      apiPath: "file/files",
      uploadable: {
        mechanism: "upload",
        fields: [
          {
            key: "relative_path",
            label: "Relative Path",
            type: "text",
            required: true,
          },
        ],
      },
    },
  ],
};
