import type { IEntityField } from "@app/utils/entityField";
import type { IActionUi } from "@plugin-sdk/ui";

const collectionVersions = ({
  key,
  label = "Collection versions",
}: {
  key: string;
  label?: string;
}): IEntityField => ({
  key,
  label,
  type: "content",
  pulpTypes: ["ansible.collection_version"],
  required: true,
});

const copyMoveFields: IEntityField[] = [
  collectionVersions({ key: "collection_versions" }),
  {
    key: "destination_repositories",
    label: "Destination repositories",
    type: "asyncResource",
    resourceKind: "repository",
    multiple: true,
    required: true,
  },
  {
    key: "signing_service",
    label: "Signing service",
    type: "asyncResource",
    resourceKind: "signingService",
    helpText: "Signs the collection versions before adding them.",
  },
];

const markFields: IEntityField[] = [
  { key: "value", label: "Mark", type: "text", required: true },
  collectionVersions({ key: "content_units" }),
];

/** The Ansible repository's actions. */
export const ansibleActions = {
  sign: {
    label: "Sign collections",
    fields: [
      {
        key: "signing_service",
        label: "Signing service",
        type: "asyncResource",
        resourceKind: "signingService",
        required: true,
      },
      collectionVersions({ key: "content_units" }),
    ],
  },
  mark: { label: "Mark collections", fields: markFields },
  unmark: { label: "Unmark collections", fields: markFields },
  "copy-collection-version": {
    label: "Copy collection versions",
    fields: copyMoveFields,
  },
  "move-collection-version": {
    label: "Move collection versions",
    fields: copyMoveFields,
  },
  "rebuild-metadata": {
    label: "Rebuild metadata",
    description:
      "Rebuilds collection metadata; narrow it to a namespace, name or version.",
    fields: [
      { key: "namespace", label: "Namespace", type: "text" },
      { key: "name", label: "Name", type: "text" },
      { key: "version", label: "Version", type: "text" },
    ],
  },
  copy: {
    label: "Advanced copy",
    description:
      "Copies content between repositories as described by a config.",
    fields: [
      {
        key: "config",
        label: "Config",
        type: "json",
        required: true,
        helpText:
          'A list of {"source_repo_version", "dest_repo", "content"} entries.',
      },
    ],
  },
} satisfies Record<string, IActionUi>;
