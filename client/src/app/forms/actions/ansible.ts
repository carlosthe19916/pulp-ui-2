import type { IEntityField } from "@app/utils/entityField";

import type { ActionFields } from "./types";

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

/** Fields of the Ansible repository actions, by action key. */
export const ANSIBLE_ACTION_FIELDS: ActionFields = {
  sign: [
    {
      key: "signing_service",
      label: "Signing service",
      type: "asyncResource",
      resourceKind: "signingService",
      required: true,
    },
    collectionVersions({ key: "content_units" }),
  ],
  mark: markFields,
  unmark: markFields,
  "copy-collection-version": copyMoveFields,
  "move-collection-version": copyMoveFields,
  "rebuild-metadata": [
    { key: "namespace", label: "Namespace", type: "text" },
    { key: "name", label: "Name", type: "text" },
    { key: "version", label: "Version", type: "text" },
  ],
  copy: [
    {
      key: "config",
      label: "Config",
      type: "json",
      required: true,
      helpText:
        'A list of {"source_repo_version", "dest_repo", "content"} entries.',
    },
  ],
};
