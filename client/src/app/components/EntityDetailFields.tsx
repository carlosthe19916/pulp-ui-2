import type React from "react";

import {
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import type { IEntityField } from "@catalog";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";

/** Write-only secrets the API never returns; omit from a read-only detail view. */
const HIDDEN_KEYS = new Set(["password", "proxy_password", "client_key"]);

const DEFAULT_GROUP = "General";

const renderValue = ({
  field,
  data,
}: {
  field: IEntityField;
  data: Record<string, unknown>;
}): React.ReactNode => {
  const value = data[field.key];

  if (field.type === "asyncResource") {
    return (
      <ResourceHrefLink
        kind={field.resourceKind}
        href={typeof value === "string" ? value : null}
      />
    );
  }

  if (field.type === "boolean") {
    return value == null ? "—" : value ? "Yes" : "No";
  }

  if (value == null || value === "") {
    return "—";
  }

  return String(value);
};

const FieldGroup: React.FC<{
  field: IEntityField;
  data: Record<string, unknown>;
}> = ({ field, data }) => (
  <DescriptionListGroup>
    <DescriptionListTerm>{field.label}</DescriptionListTerm>
    <DescriptionListDescription>
      {renderValue({ field, data })}
    </DescriptionListDescription>
  </DescriptionListGroup>
);

/**
 * Renders a read-only `DescriptionList` for an entity from its catalog field
 * descriptors (the same `IEntityField`s that drive the create/edit form), reading
 * values out of the response by `field.key`. Plugin-generic: any plugin's declared
 * fields render with no per-plugin detail code. When fields carry wizard `group`s
 * (e.g. remotes), they're split into labelled sections.
 */
export const EntityDetailFields: React.FC<{
  fields: IEntityField[];
  data: Record<string, unknown>;
}> = ({ fields, data }) => {
  const visible = fields.filter(
    (field) => field.type !== "file" && !HIDDEN_KEYS.has(field.key),
  );

  const hasGroups = visible.some((field) => field.group);
  if (!hasGroups) {
    return (
      <DescriptionList isHorizontal>
        {visible.map((field) => (
          <FieldGroup key={field.key} field={field} data={data} />
        ))}
      </DescriptionList>
    );
  }

  const groupNames = [
    ...new Set(visible.map((field) => field.group ?? DEFAULT_GROUP)),
  ];
  return (
    <Stack hasGutter>
      {groupNames.map((groupName) => (
        <StackItem key={groupName}>
          <Content component={ContentVariants.h3}>{groupName}</Content>
          <DescriptionList isHorizontal>
            {visible
              .filter((field) => (field.group ?? DEFAULT_GROUP) === groupName)
              .map((field) => (
                <FieldGroup key={field.key} field={field} data={data} />
              ))}
          </DescriptionList>
        </StackItem>
      ))}
    </Stack>
  );
};
