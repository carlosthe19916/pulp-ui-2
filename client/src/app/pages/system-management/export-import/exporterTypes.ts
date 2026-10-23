import type { IEntityField } from "@catalog";

/** One exporter type: how it is configured and what one export takes. */
export interface IExporterType {
  apiPath: string;
  label: string;
  fields: IEntityField[];
  exportFields: IEntityField[];
}

const baseFields: IEntityField[] = [
  { key: "name", label: "Name", type: "text", required: true },
  {
    key: "path",
    label: "Path",
    type: "text",
    required: true,
    helpText:
      "A directory on the Pulp server; it must be an allowed export path.",
  },
];

export const EXPORTER_TYPES: IExporterType[] = [
  {
    apiPath: "core/pulp",
    label: "Pulp",
    fields: [
      ...baseFields,
      {
        key: "repositories",
        label: "Repositories",
        type: "asyncResource",
        resourceKind: "repository",
        multiple: true,
        required: true,
      },
    ],
    exportFields: [
      {
        key: "full",
        label: "Full export",
        type: "boolean",
        defaultValue: true,
        helpText: "Off exports only what changed since the last export.",
      },
      {
        key: "chunk_size",
        label: "Chunk size",
        type: "text",
        helpText: "Split the archive into pieces, e.g. 500MB or 1GB.",
      },
      {
        key: "dry_run",
        label: "Dry run",
        type: "boolean",
        helpText: "Only report what would be exported and the space needed.",
      },
    ],
  },
  {
    apiPath: "core/filesystem",
    label: "Filesystem",
    fields: [
      ...baseFields,
      {
        key: "method",
        label: "Method",
        type: "select",
        defaultValue: "write",
        options: [
          { value: "write", label: "Write files" },
          { value: "hardlink", label: "Hardlink" },
          { value: "symlink", label: "Symlink" },
        ],
      },
    ],
    exportFields: [
      {
        key: "publication",
        label: "Publication",
        type: "asyncResource",
        resourceKind: "publication",
        helpText: "Export a publication, or a repository version below.",
      },
      {
        key: "repository_version",
        label: "Repository version",
        type: "text",
        helpText: "A repository version href.",
      },
      {
        key: "start_repository_version",
        label: "Start repository version",
        type: "text",
        helpText: "Export only what changed since this version.",
      },
    ],
  },
];

export const IMPORTER_FIELDS: IEntityField[] = [
  { key: "name", label: "Name", type: "text", required: true },
  {
    key: "repo_mapping",
    label: "Repository mapping",
    type: "json",
    helpText:
      'Maps repository names in the export to names here, e.g. {"export-repo": "local-repo"}.',
  },
];

export const IMPORT_FIELDS: IEntityField[] = [
  {
    key: "path",
    label: "Export file",
    type: "text",
    helpText: "Path of the export archive on the Pulp server.",
  },
  {
    key: "toc",
    label: "Table of contents",
    type: "text",
    helpText:
      "Path of the TOC file of a chunked export; use instead of a file.",
  },
  {
    key: "create_repositories",
    label: "Create missing repositories",
    type: "boolean",
  },
];

export const IMPORT_CHECK_FIELDS: IEntityField[] = [
  { key: "path", label: "Export file", type: "text" },
  { key: "toc", label: "Table of contents", type: "text" },
  {
    key: "repo_mapping",
    label: "Repository mapping",
    type: "textarea",
    helpText: "The JSON mapping the import would use.",
  },
];
