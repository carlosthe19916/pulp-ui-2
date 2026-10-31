import type { PulpType } from "@catalog";

import type { IEntityField } from "@app/utils/entityField";

const relativePath = ({
  required = false,
}: { required?: boolean } = {}): IEntityField => ({
  key: "relative_path",
  label: "Relative path",
  type: "text",
  required,
});

/**
 * What each uploadable content type asks for per file, by content pulp_type (`[]`: just the
 * file). The catalog declares that a type is uploadable and how; its fields are UI.
 */
export const UPLOAD_FIELDS: Record<PulpType, IEntityField[]> = {
  "file.file": [relativePath({ required: true })],
  "rpm.package": [],
  "rpm.advisory": [],
  "python.python": [],
  "python.provenance": [
    {
      key: "package",
      label: "Package href",
      type: "text",
      required: true,
      helpText: "The pulp_href of the Python package this provenance is for.",
    },
  ],
  "gem.gem": [],
  "npm.package": [
    relativePath(),
    { key: "name", label: "Name", type: "text" },
    { key: "version", label: "Version", type: "text" },
  ],
  "maven.artifact": [relativePath({ required: true })],
  "maven.metadata": [relativePath({ required: true })],
  "deb.package": [
    relativePath(),
    { key: "distribution", label: "Distribution", type: "text" },
    { key: "component", label: "Component", type: "text" },
  ],
  "deb.generic": [relativePath({ required: true })],
  "deb.installer_package": [relativePath()],
  "ansible.collection_version": [
    { key: "expected_namespace", label: "Expected namespace", type: "text" },
    { key: "expected_name", label: "Expected name", type: "text" },
    { key: "expected_version", label: "Expected version", type: "text" },
  ],
  "ansible.collection_signature": [
    {
      key: "signed_collection",
      label: "Signed collection href",
      type: "text",
      required: true,
      helpText: "The pulp_href of the collection version this signature signs.",
    },
  ],
  "core.openpgp_publickey": [],
};

/** A content type's per-file upload fields. */
export const getUploadFields = (contentType: PulpType): IEntityField[] =>
  UPLOAD_FIELDS[contentType] ?? [];
