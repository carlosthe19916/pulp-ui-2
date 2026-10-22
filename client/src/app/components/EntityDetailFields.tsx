import type React from "react";

import {
  ClipboardCopy,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListTermHelpText,
  DescriptionListTermHelpTextButton,
  Popover,
} from "@patternfly/react-core";
import type { DescriptionListProps } from "@patternfly/react-core";

import type { IEntityField } from "@catalog";
import { NamedResourceHrefLink } from "@app/components/NamedResourceHrefLink";
import { isEmptyValue } from "@app/utils/utils";

/** The server's write-only-secret descriptor (`hidden_fields` on every response). */
type HiddenField = { name: string; is_set: boolean };

/** One field's render inputs, shared by `renderValue` and `FieldGroup`. */
interface IFieldRender {
  field: IEntityField;
  data: Record<string, unknown>;
  copyable: boolean;
}

interface IEntityDetailFieldsProps {
  fields: IEntityField[];
  data: Record<string, unknown>;
  /** Field keys whose value should render with a copy-to-clipboard affordance. */
  copyableKeys?: string[];
  /** Responsive column layout, forwarded to the underlying `DescriptionList`. */
  columnModifier?: DescriptionListProps["columnModifier"];
}

const getHiddenField = ({
  key,
  data,
}: {
  key: string;
  data: Record<string, unknown>;
}): HiddenField | undefined => {
  const hidden = data.hidden_fields;
  if (!Array.isArray(hidden)) {
    return undefined;
  }
  return (hidden as HiddenField[]).find((field) => field.name === key);
};

const renderValue = ({
  field,
  data,
  copyable,
}: IFieldRender): React.ReactNode => {
  // Secrets aren't returned by the API; `hidden_fields` only reports whether they're set.
  const secret = getHiddenField({ key: field.key, data });
  if (secret) {
    return secret.is_set ? "Set" : "Not set";
  }

  const value = data[field.key];

  if (field.type === "asyncResource") {
    return (
      <NamedResourceHrefLink
        kind={field.resourceKind}
        href={typeof value === "string" ? value : null}
      />
    );
  }

  if (field.type === "boolean") {
    return value == null ? "—" : value ? "Yes" : "No";
  }

  if (isEmptyValue(value)) {
    return "—";
  }

  if (Array.isArray(value)) {
    return value.filter((item) => item != null && item !== "").join(", ");
  }

  // Certificates are long and multi-line — collapse into an expandable copyable block.
  if (typeof value === "string" && value.startsWith("-----BEGIN")) {
    return (
      <ClipboardCopy variant="expansion" isReadOnly isCode>
        {value}
      </ClipboardCopy>
    );
  }

  if (copyable && typeof value === "string") {
    return (
      <ClipboardCopy variant="inline-compact" isReadOnly>
        {value}
      </ClipboardCopy>
    );
  }

  return String(value);
};

const FieldGroup: React.FC<IFieldRender> = ({ field, data, copyable }) => (
  <DescriptionListGroup>
    {field.helpText ? (
      <DescriptionListTermHelpText>
        <Popover headerContent={field.label} bodyContent={field.helpText}>
          <DescriptionListTermHelpTextButton>
            {field.label}
          </DescriptionListTermHelpTextButton>
        </Popover>
      </DescriptionListTermHelpText>
    ) : (
      <DescriptionListTerm>{field.label}</DescriptionListTerm>
    )}
    <DescriptionListDescription>
      {renderValue({ field, data, copyable })}
    </DescriptionListDescription>
  </DescriptionListGroup>
);

/**
 * Read-only `DescriptionList` built from an entity's catalog field descriptors,
 * reading values by `field.key`. Plugin-generic. A field's `helpText` renders a term
 * popover; `copyableKeys` is a presentation-only opt-in. Callers split `fields` by
 * group for sectioned layouts.
 */
export const EntityDetailFields: React.FC<IEntityDetailFieldsProps> = ({
  fields,
  data,
  copyableKeys,
  columnModifier,
}) => {
  const visible = fields.filter((field) => field.type !== "file");
  const copyable = new Set(copyableKeys);

  return (
    <DescriptionList columnModifier={columnModifier}>
      {visible.map((field) => (
        <FieldGroup
          key={field.key}
          field={field}
          data={data}
          copyable={copyable.has(field.key)}
        />
      ))}
    </DescriptionList>
  );
};
