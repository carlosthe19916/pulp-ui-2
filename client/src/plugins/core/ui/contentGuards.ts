import { contentGuardBaseFields } from "@app/forms/fragments";
import type { IContentGuardTypeUi } from "@plugin-sdk/ui";

const headerName = {
  key: "header_name",
  label: "Header name",
  type: "text",
  required: true,
} as const;

/** pulpcore's content guards. */
export const coreContentGuards = {
  "core.rbac": {
    label: "RBAC",
    description: "Only users and groups granted the downloader role.",
    fields: contentGuardBaseFields,
  },
  "core.content_redirect": {
    label: "Content redirect",
    description: "Only through the API's preauthenticated redirect URLs.",
    fields: contentGuardBaseFields,
  },
  "core.header": {
    label: "Header",
    description: "Requests carrying a header with a given value.",
    fields: [
      ...contentGuardBaseFields,
      headerName,
      {
        key: "header_value",
        label: "Header value",
        type: "text",
        required: true,
      },
      {
        key: "jq_filter",
        label: "jq filter",
        type: "text",
        helpText: "Extracts the value from a base64-encoded JSON header.",
      },
    ],
  },
  "core.envvar_header": {
    label: "Environment variable header",
    description:
      "Requests whose header matches an environment variable of the content app.",
    fields: [
      ...contentGuardBaseFields,
      headerName,
      {
        key: "env_var",
        label: "Environment variable",
        type: "text",
        required: true,
      },
    ],
  },
  "core.composite": {
    label: "Composite",
    description: "Requests that pass any one of several guards.",
    fields: [
      ...contentGuardBaseFields,
      {
        key: "guards",
        label: "Guards",
        type: "asyncResource",
        resourceKind: "contentGuard",
        multiple: true,
      },
    ],
  },
} satisfies Record<string, IContentGuardTypeUi>;
