import {
  distributionBase,
  publicationBase,
  remoteBase,
  repositoryBase,
} from "../base-fields";
import { definePlugin, whenInstalled } from "../compose";
import type { IEntityField } from "../field-types";

const fileDistributionExtras: IEntityField[] = [
  {
    key: "repository",
    label: "Repository",
    type: "resource",
    resourceKind: "repository",
  },
  {
    key: "publication",
    label: "Publication",
    type: "resource",
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
export const file = definePlugin({
  app: { isAvailable: whenInstalled("file", "pulp-file") },
  ui: { label: "File" },
  rest: { pulpType: "file.file", apiPath: "file/file" },
  entities: {
    // File repository: a remote to sync from plus auto-publish.
    repository: {
      capabilities: {
        sync: { remoteTypes: ["file.file", "file.git"] },
        publish: true,
      },
      form: {
        createFields: [
          ...repositoryBase.create,
          {
            key: "remote",
            label: "Remote",
            type: "resource",
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
            type: "resource",
            resourceKind: "remote",
          },
          { key: "autopublish", label: "Auto-publish", type: "boolean" },
        ],
      },
      page: {
        detailFields: [
          ...repositoryBase.detail,
          { key: "autopublish", label: "Auto-publish", type: "boolean" },
          { key: "manifest", label: "Manifest", type: "text" },
        ],
      },
    },

    // File remote (file.file) + Git remote (file.git) — two variants of the slot.
    // A FileRepository's backend REMOTE_TYPES is [FileRemote, FileGitRemote], so
    // both can be synced from; declaring the git variant here lets the sync UI
    // offer it and lets users create one.
    remote: [
      {
        isWizard: true,
        form: { createFields: remoteBase.create, editFields: remoteBase.edit },
        page: { detailFields: remoteBase.detail },
      },
      {
        ui: { label: "File (Git)" },
        rest: { pulpType: "file.git", apiPath: "file/git" },
        isWizard: true,
        form: {
          createFields: [
            ...withoutPolicy(remoteBase.create),
            ...fileGitRemoteExtras,
          ],
          editFields: [
            ...withoutPolicy(remoteBase.edit),
            ...fileGitRemoteExtras,
          ],
        },
        page: {
          detailFields: [
            ...remoteBase.detail,
            { key: "git_ref", label: "Git Ref", type: "text" },
          ],
        },
      },
    ],

    // File distribution: serves a repository or a specific publication.
    distribution: {
      form: {
        createFields: [...distributionBase.create, ...fileDistributionExtras],
        editFields: [...distributionBase.edit, ...fileDistributionExtras],
      },
      page: {
        detailFields: [
          ...distributionBase.detail,
          { key: "repository", label: "Repository", type: "text" },
          { key: "publication", label: "Publication", type: "text" },
        ],
        browseCardFields: [
          { key: "base_path", label: "Base path", type: "text" },
          { key: "base_url", label: "Base URL", type: "text" },
        ],
      },
    },

    // File publication: base supplies the repository; adds repository_version.
    publication: {
      form: {
        createFields: [
          ...publicationBase.create,
          {
            key: "repository_version",
            label: "Repository Version",
            type: "text",
          },
        ],
      },
      page: {
        detailFields: [
          ...publicationBase.detail,
          { key: "manifest", label: "Manifest", type: "text" },
        ],
      },
    },

    // File content: an uploadable file unit; the collection path is file/files.
    content: {
      rest: { apiPath: "file/files" },
      capabilities: { upload: true },
      form: {
        createFields: [
          {
            key: "relative_path",
            label: "Relative Path",
            type: "text",
            required: true,
          },
          { key: "file", label: "File", type: "file", required: true },
          {
            key: "repository",
            label: "Repository",
            type: "resource",
            resourceKind: "repository",
          },
        ],
      },
      page: {
        detailFields: [
          { key: "relative_path", label: "Relative Path", type: "text" },
          { key: "sha256", label: "SHA-256", type: "text" },
          { key: "md5", label: "MD5", type: "text" },
          { key: "sha1", label: "SHA-1", type: "text" },
          { key: "sha512", label: "SHA-512", type: "text" },
        ],
        browseDetailFields: [
          { key: "relative_path", label: "Relative Path", type: "text" },
          { key: "sha256", label: "SHA-256", type: "text" },
          { key: "sha1", label: "SHA-1", type: "text" },
          { key: "md5", label: "MD5", type: "text" },
          { key: "sha512", label: "SHA-512", type: "text" },
        ],
      },
    },
  },
});
