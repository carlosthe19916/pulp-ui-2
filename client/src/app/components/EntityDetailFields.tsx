import type React from "react";

import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
} from "@patternfly/react-core";

import type { IEntityField } from "@catalog";
import { getFieldValue } from "@app/components/Entity/formSchema";

import { ResourceHrefLink } from "./ResourceHrefLink";

interface IEntityDetailFieldsProps {
  fields: IEntityField[] | undefined;
  entity: object;
  /** Keys already rendered by the shell; skip to avoid duplicates. */
  skipKeys?: string[];
}

const formatValue = (field: IEntityField, value: unknown): React.ReactNode => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (field.type === "boolean") {
    return (
      <Label color={value ? "green" : "grey"} isCompact>
        {value ? "Enabled" : "Disabled"}
      </Label>
    );
  }

  if (field.type === "resource") {
    return (
      <ResourceHrefLink
        kind={field.resourceKind}
        href={typeof value === "string" ? value : undefined}
      />
    );
  }

  return String(value);
};

export const EntityDetailFields: React.FC<IEntityDetailFieldsProps> = ({
  fields,
  entity,
  skipKeys = [],
}) => {
  if (!fields?.length) {
    return null;
  }

  const skip = new Set(skipKeys);

  return (
    <>
      {fields
        .filter((field) => !skip.has(field.key))
        .map((field) => (
          <DescriptionListGroup key={field.key}>
            <DescriptionListTerm>{field.label}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatValue(field, getFieldValue(entity, field.key))}
            </DescriptionListDescription>
          </DescriptionListGroup>
        ))}
    </>
  );
};
