import type { IEntityField } from "@catalog";

/** One content guard type: its collection and form fields. */
export interface IGuardType {
  pulpType: string;
  apiPath: string;
  label: string;
  description: string;
  fields: IEntityField[];
  /** The Pulp component that provides it. */
  component: string;
  /** Who may download is managed through the guard's own roles. */
  hasAccess?: boolean;
}

const baseFields: IEntityField[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "description", label: "Description", type: "textarea" },
];

const caCertificate: IEntityField = {
  key: "ca_certificate",
  label: "CA certificate",
  type: "textarea",
  required: true,
  helpText:
    "PEM-encoded CA certificate that client certificates must chain to.",
};

export const GUARD_TYPES: IGuardType[] = [
  {
    pulpType: "core.rbac",
    apiPath: "core/rbac",
    label: "RBAC",
    description: "Only users and groups granted the downloader role.",
    fields: baseFields,
    component: "core",
    hasAccess: true,
  },
  {
    pulpType: "core.content_redirect",
    apiPath: "core/content_redirect",
    label: "Content redirect",
    description: "Only through the API's preauthenticated redirect URLs.",
    fields: baseFields,
    component: "core",
  },
  {
    pulpType: "core.header",
    apiPath: "core/header",
    label: "Header",
    description: "Requests carrying a header with a given value.",
    fields: [
      ...baseFields,
      {
        key: "header_name",
        label: "Header name",
        type: "text",
        required: true,
      },
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
    component: "core",
  },
  {
    pulpType: "core.envvar_header",
    apiPath: "core/envvar_header",
    label: "Environment variable header",
    description:
      "Requests whose header matches an environment variable of the content app.",
    fields: [
      ...baseFields,
      {
        key: "header_name",
        label: "Header name",
        type: "text",
        required: true,
      },
      {
        key: "env_var",
        label: "Environment variable",
        type: "text",
        required: true,
      },
    ],
    component: "core",
  },
  {
    pulpType: "core.composite",
    apiPath: "core/composite",
    label: "Composite",
    description: "Requests that pass any one of several guards.",
    fields: [
      ...baseFields,
      {
        key: "guards",
        label: "Guards",
        type: "asyncResource",
        resourceKind: "contentGuard",
        multiple: true,
      },
    ],
    component: "core",
  },
  {
    pulpType: "certguard.x509",
    apiPath: "certguard/x509",
    label: "X.509 certificate",
    description: "Clients presenting a certificate signed by a CA.",
    fields: [...baseFields, caCertificate],
    component: "certguard",
  },
  {
    pulpType: "certguard.rhsm",
    apiPath: "certguard/rhsm",
    label: "RHSM certificate",
    description: "Clients presenting an entitlement certificate for the path.",
    fields: [...baseFields, caCertificate],
    component: "certguard",
  },
];

/** A guard's type, from its href (`…/contentguards/<app>/<slug>/<id>/`). */
export const guardTypeOf = (href: string): IGuardType | undefined => {
  const match = href.match(/\/contentguards\/([^/]+)\/([^/]+)\//);
  return match
    ? GUARD_TYPES.find((type) => type.apiPath === `${match[1]}/${match[2]}`)
    : undefined;
};
