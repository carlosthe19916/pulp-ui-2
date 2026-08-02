import type { VersionResponse } from "@app/client";

export type ResourceKind =
  "repository" | "remote" | "distribution" | "publication" | "content";

export type FieldType =
  "text" | "textarea" | "number" | "boolean" | "select" | "file" | "resource";

export interface FieldDescriptor {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: unknown;
  /** For type: "resource", which resource kind the picker should offer. */
  resourceKind?: ResourceKind;
}

export interface ResourceDescriptor {
  /** Pulp type identifier, e.g. "file.file" */
  pulpType: string;

  /** Which resource concept this descriptor belongs to */
  kind: ResourceKind;

  /** Human-readable label, e.g. "File" */
  label: string;

  /** Fields shown in create modal (beyond common fields the shell handles) */
  createFields?: FieldDescriptor[];

  /** Fields shown in edit modal */
  editFields?: FieldDescriptor[];

  /** Extra fields shown in detail DescriptionList */
  detailFields?: FieldDescriptor[];

  /** Extra fields shown on browse distribution cards */
  browseCardFields?: FieldDescriptor[];

  /** Fields shown on browse content detail (consumer surface) */
  browseDetailFields?: FieldDescriptor[];

  /** Whether this resource type supports sync (repositories only) */
  supportsSync?: boolean;

  /** Whether this resource type supports publish (repositories only) */
  supportsPublish?: boolean;

  /** Whether content can be uploaded for this type */
  supportsUpload?: boolean;

  /** Check whether the plugin providing this type is installed */
  isAvailable: (plugins: VersionResponse[]) => boolean;
}
