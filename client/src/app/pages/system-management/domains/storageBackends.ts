import * as yup from "yup";

import type { StorageClassEnum } from "@app/client";

export interface IStorageSettingField {
  /** The literal key sent inside `storage_settings`. */
  key: string;
  label: string;
  required?: boolean;
  isPassword?: boolean;
  helperText?: string;
}

export interface IStorageBackend {
  value: StorageClassEnum;
  label: string;
  deprecated?: boolean;
  // Fields and their `required` flags mirror pulpcore's storage_settings serializer
  // (verified against a live backend) so client validation matches the server.
  settingsFields: IStorageSettingField[];
}

// S3 and its deprecated boto3 variant share the same settings. The backend also
// accepts `security_token` in place of `secret_key`, but that advanced flow isn't
// exposed here — requiring `secret_key` keeps a combination the backend accepts.
const S3_FIELDS: IStorageSettingField[] = [
  { key: "bucket_name", label: "Bucket name", required: true },
  { key: "access_key", label: "Access key", required: true },
  { key: "secret_key", label: "Secret key", required: true, isPassword: true },
  { key: "region_name", label: "Region" },
  {
    key: "endpoint_url",
    label: "Endpoint URL",
    helperText: "Override for S3-compatible services.",
  },
];

export const STORAGE_BACKENDS: IStorageBackend[] = [
  {
    value: "pulpcore.app.models.storage.FileSystem",
    label: "Local filesystem",
    settingsFields: [
      {
        key: "location",
        label: "Location",
        required: true,
        helperText:
          "Absolute directory on the Pulp host for stored content, e.g. /var/lib/pulp/media/my-domain.",
      },
    ],
  },
  {
    value: "storages.backends.s3.S3Storage",
    label: "Amazon S3",
    settingsFields: S3_FIELDS,
  },
  {
    value: "storages.backends.s3boto3.S3Boto3Storage",
    label: "Amazon S3 (boto3)",
    deprecated: true,
    settingsFields: S3_FIELDS,
  },
  {
    value: "storages.backends.azure_storage.AzureStorage",
    label: "Azure Blob",
    settingsFields: [
      { key: "azure_container", label: "Container", required: true },
      { key: "account_name", label: "Account name", required: true },
      {
        key: "account_key",
        label: "Account key",
        required: true,
        isPassword: true,
      },
      {
        key: "connection_string",
        label: "Connection string",
        isPassword: true,
      },
    ],
  },
  {
    // OCI requires the pulp_service plugin; its requireds are unverified here
    // (the plugin isn't installed on the dev backend), so this is best-effort.
    value: "pulp_service.app.storage.OCIStorage",
    label: "OCI",
    settingsFields: [
      { key: "bucket_name", label: "Bucket name", required: true },
      { key: "namespace", label: "Namespace" },
      { key: "region", label: "Region" },
    ],
  },
];

export const STORAGE_BACKEND_BY_CLASS: Record<
  StorageClassEnum,
  IStorageBackend
> = Object.fromEntries(
  STORAGE_BACKENDS.map((backend) => [backend.value, backend]),
) as Record<StorageClassEnum, IStorageBackend>;

export const storageClassLabel = (value: StorageClassEnum): string =>
  STORAGE_BACKEND_BY_CLASS[value]?.label ?? value;

/** yup schema for the selected backend's `storage_settings`. */
export const buildStorageSettingsSchema = (storageClass: StorageClassEnum) => {
  const backend = STORAGE_BACKEND_BY_CLASS[storageClass];
  return yup.object(
    Object.fromEntries(
      (backend?.settingsFields ?? []).map((field) => [
        field.key,
        field.required
          ? yup.string().trim().required(`${field.label} is required`)
          : yup.string().trim(),
      ]),
    ),
  );
};
