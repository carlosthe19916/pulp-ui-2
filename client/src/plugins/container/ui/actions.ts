import type { IEntityField } from "@app/utils/entityField";
import type { IActionUi } from "@plugin-sdk/ui";

const tag: IActionUi = {
  label: "Tag image",
  fields: [
    { key: "tag", label: "Tag", type: "text", required: true },
    {
      key: "digest",
      label: "Manifest digest",
      type: "text",
      required: true,
      helpText: "sha256 of the manifest to tag.",
    },
  ],
};

// Also a row action on the Browse Tags view, prefilled with the tag.
const untag: IActionUi = {
  label: "Untag image",
  fields: [{ key: "tag", label: "Tag", type: "text", required: true }],
};

const sign: IActionUi = {
  label: "Sign images",
  fields: [
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
  ],
};

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

/** The container repository's actions. */
export const containerActions = {
  tag,
  untag,
  "copy-tags": {
    label: "Copy tags",
    fields: [
      ...sourceFields,
      {
        key: "names",
        label: "Tags",
        type: "stringList",
        helpText: "Leave empty to copy all tags.",
      },
    ],
  },
  "copy-manifests": {
    label: "Copy manifests",
    fields: [
      ...sourceFields,
      {
        key: "digests",
        label: "Digests",
        type: "stringList",
        helpText: "Leave empty to copy all manifests.",
      },
      { key: "media_types", label: "Media types", type: "stringList" },
    ],
  },
  sign,
  "build-image": {
    label: "Build image",
    description:
      "Builds an OCI image from a Containerfile into a new version (tech preview).",
    fields: [
      { key: "containerfile", label: "Containerfile", type: "file" },
      {
        key: "containerfile_name",
        label: "Containerfile name",
        type: "text",
        helpText:
          "A Containerfile from the build context, instead of an upload.",
      },
      { key: "tag", label: "Tag", type: "text" },
      {
        key: "build_context",
        label: "Build context",
        type: "text",
        helpText:
          "A repository version href whose files are the build context.",
      },
    ],
  },
} satisfies Record<string, IActionUi>;

/** The container push repository's actions. */
export const containerPushActions = {
  tag,
  untag,
  "remove-image": {
    label: "Remove image",
    fields: [
      { key: "digest", label: "Manifest digest", type: "text", required: true },
    ],
  },
  "remove-signatures": {
    label: "Remove signatures",
    fields: [
      {
        key: "signed_with_key_id",
        label: "Key ID",
        type: "text",
        required: true,
      },
    ],
  },
  sign,
  migrate: {
    label: "Convert to container repository",
    description:
      "Converts this push repository into a container repository in place, keeping its version history.",
    fields: [],
  },
} satisfies Record<string, IActionUi>;
