import type { IEntityField } from "@app/utils/entityField";

import type { ActionFields } from "./types";

const tagFields: IEntityField[] = [
  { key: "tag", label: "Tag", type: "text", required: true },
  {
    key: "digest",
    label: "Manifest digest",
    type: "text",
    required: true,
    helpText: "sha256 of the manifest to tag.",
  },
];

const untagFields: IEntityField[] = [
  { key: "tag", label: "Tag", type: "text", required: true },
];

const signFields: IEntityField[] = [
  {
    key: "manifest_signing_service",
    label: "Signing service",
    type: "asyncResource",
    resourceKind: "signingService",
    helpText: "Overrides the repository's signing service.",
  },
  {
    key: "future_base_path",
    label: "Future base path",
    type: "text",
    helpText:
      "Where the content will be distributed (for synced repositories).",
  },
  { key: "tags_list", label: "Tags", type: "stringList" },
];

const sourceFields: IEntityField[] = [
  {
    key: "source_repository",
    label: "Source repository",
    type: "asyncResource",
    resourceKind: "repository",
  },
  {
    key: "source_repository_version",
    label: "Source repository version",
    type: "text",
    helpText: "A version href; use instead of a source repository.",
  },
];

/** Fields of the container repository actions, by action key. */
export const CONTAINER_ACTION_FIELDS: ActionFields = {
  tag: tagFields,
  untag: untagFields,
  "copy-tags": [
    ...sourceFields,
    {
      key: "names",
      label: "Tags",
      type: "stringList",
      helpText: "Leave empty to copy all tags.",
    },
  ],
  "copy-manifests": [
    ...sourceFields,
    {
      key: "digests",
      label: "Digests",
      type: "stringList",
      helpText: "Leave empty to copy all manifests.",
    },
    { key: "media_types", label: "Media types", type: "stringList" },
  ],
  sign: signFields,
  "build-image": [
    { key: "containerfile", label: "Containerfile", type: "file" },
    {
      key: "containerfile_name",
      label: "Containerfile name",
      type: "text",
      helpText: "A Containerfile from the build context, instead of an upload.",
    },
    { key: "tag", label: "Tag", type: "text" },
    {
      key: "build_context",
      label: "Build context",
      type: "text",
      helpText: "A repository version href whose files are the build context.",
    },
  ],
};

/** Fields of the container push repository actions, by action key. */
export const CONTAINER_PUSH_ACTION_FIELDS: ActionFields = {
  tag: tagFields,
  untag: untagFields,
  "remove-image": [
    { key: "digest", label: "Manifest digest", type: "text", required: true },
  ],
  "remove-signatures": [
    {
      key: "signed_with_key_id",
      label: "Key ID",
      type: "text",
      required: true,
    },
  ],
  sign: signFields,
  migrate: [],
};
