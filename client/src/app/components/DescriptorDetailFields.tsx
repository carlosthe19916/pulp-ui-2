import type React from "react";

import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
} from "@patternfly/react-core";

import { getFieldValue } from "@app/descriptors/formSchema";
import type { IFieldDescriptor } from "@app/descriptors/types";
import type { ResourceKind } from "@app/descriptors/types";

import { ResourceHrefLink } from "./ResourceHrefLink";

interface IDescriptorDetailFieldsProps {
  fields: IFieldDescriptor[] | undefined;
  entity: object;
  /** Keys already rendered by the shell; skip to avoid duplicates. */
  skipKeys?: string[];
}

function formatValue(field: IFieldDescriptor, value: unknown): React.ReactNode {
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

  if (field.type === "resource" && field.resourceKind) {
    return (
      <ResourceHrefLink
        kind={field.resourceKind as ResourceKind}
        href={typeof value === "string" ? value : undefined}
      />
    );
  }

  return String(value);
}

/** Render descriptor `detailFields` as DescriptionList groups. */
export const DescriptorDetailFields: React.FC<IDescriptorDetailFieldsProps> = ({
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
