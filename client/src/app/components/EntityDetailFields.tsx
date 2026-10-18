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
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";

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

const isEmpty = (value: unknown): boolean =>
  value == null ||
  value === "" ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as object).length === 0);

const renderValue = ({
  field,
  data,
  copyable,
}: IFieldRender): React.ReactNode => {
  // Write-only secrets are never returned by the API — the server only tells us
  // whether a value is set, via `hidden_fields`.
  const secret = getHiddenField({ key: field.key, data });
  if (secret) {
    return secret.is_set ? "Set" : "Not set";
  }

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

  if (isEmpty(value)) {
    return "—";
  }

  if (Array.isArray(value)) {
    return value.filter((item) => item != null && item !== "").join(", ");
  }

  // PEM blocks (CA/client certificates) are long and multi-line — collapse them
  // into an expandable, copyable code block rather than dumping them inline.
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
 * Renders a read-only `DescriptionList` for an entity from its catalog field
 * descriptors (the same `IEntityField`s that drive the create/edit form), reading
 * values out of the response by `field.key`. Plugin-generic: any plugin's declared
 * fields render with no per-plugin detail code.
 *
 * Value rendering: write-only secrets show "Set"/"Not set" from `hidden_fields`;
 * PEM certificates collapse into an expandable copyable block; arrays join on commas;
 * empty values show "—". A field's `helpText` (catalog metadata) renders as an
 * OpenShift-style term help popover. `copyableKeys` adds an inline copy affordance —
 * a presentation choice passed by the caller, not part of the catalog field model.
 * Callers wanting visual grouping (a section per wizard group) split `fields`
 * themselves and render one list per group.
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
    <DescriptionList isHorizontal columnModifier={columnModifier}>
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
