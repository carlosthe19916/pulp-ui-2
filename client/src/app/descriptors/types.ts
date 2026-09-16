import type { VersionResponse } from "@app/client";

export type ResourceKind =
  "repository" | "remote" | "distribution" | "publication" | "content";

export type FieldType =
  "text" | "textarea" | "number" | "boolean" | "select" | "file" | "resource";

export interface IFieldDescriptor {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: unknown;
  /** For type: "resource", which resource kind the picker should offer. */
  resourceKind?: ResourceKind;
}

export interface IResourceDescriptor {
  /** Pulp type identifier, e.g. "file.file" */
  pulpType: string;

  kind: ResourceKind;

  /** Human-readable label, e.g. "File" */
  label: string;

  /** Fields shown in create modal (beyond common fields the shell handles) */
  createFields?: IFieldDescriptor[];

  editFields?: IFieldDescriptor[];

  /** Extra fields shown in detail DescriptionList */
  detailFields?: IFieldDescriptor[];

  /** Extra fields shown on browse distribution cards */
  browseCardFields?: IFieldDescriptor[];

  /** Fields shown on browse content detail (consumer surface) */
  browseDetailFields?: IFieldDescriptor[];

  /** Whether this resource type supports sync (repositories only) */
  supportsSync?: boolean;

  /** Whether this resource type supports publish (repositories only) */
  supportsPublish?: boolean;

  supportsUpload?: boolean;

  /** Check whether the plugin providing this type is installed */
  isAvailable: (plugins: VersionResponse[]) => boolean;
}
