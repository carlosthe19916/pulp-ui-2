import type React from "react";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from "@patternfly/react-core";

import type { DomainResponse } from "@app/client";

import {
  getDomainStorageSettings,
  type IStorageSettingField,
  STORAGE_BACKEND_BY_CLASS,
  storageClassLabel,
} from "../../utils/storageBackends";

/** The server's write-only-secret descriptor (`hidden_fields` on every response). */
interface IHiddenField {
  name: string;
  is_set: boolean;
}

interface IDomainStorageDetailsProps {
  domain: DomainResponse;
}

/** Whether the server reports this write-only secret as set, or undefined if not listed. */
const isSecretSet = ({
  domain,
  key,
}: {
  domain: DomainResponse;
  key: string;
}): boolean | undefined => {
  const hidden = (domain as { hidden_fields?: IHiddenField[] }).hidden_fields;
  return Array.isArray(hidden)
    ? hidden.find((field) => field.name === key)?.is_set
    : undefined;
};

const describeValue = ({
  field,
  settings,
  domain,
}: {
  field: IStorageSettingField;
  settings: Record<string, unknown>;
  domain: DomainResponse;
}): string => {
  const value = settings[field.key];
  const hasValue = value != null && value !== "";
  // Secrets are redacted in the response; show whether they're set, never the value —
  // falling back to value-presence when hidden_fields omits the key.
  if (field.isPassword) {
    const isSet = isSecretSet({ domain, key: field.key }) ?? hasValue;
    return isSet ? "Set" : "Not set";
  }
  return hasValue ? String(value) : "—";
};

/**
 * Read-only view of a domain's storage backend settings, shown when the Storage cell
 * expands. Secret fields render "Set"/"Not set" via `hidden_fields` — never their value.
 */
export const DomainStorageDetails: React.FC<IDomainStorageDetailsProps> = ({
  domain,
}) => {
  const backend = STORAGE_BACKEND_BY_CLASS[domain.storage_class];
  const settings = getDomainStorageSettings(domain);

  return (
    <DescriptionList columnModifier={{ default: "2Col" }} isCompact>
      <DescriptionListGroup>
        <DescriptionListTerm>Backend</DescriptionListTerm>
        <DescriptionListDescription>
          {storageClassLabel(domain.storage_class)}
        </DescriptionListDescription>
      </DescriptionListGroup>
      {(backend?.settingsFields ?? []).map((field) => (
        <DescriptionListGroup key={field.key}>
          <DescriptionListTerm>{field.label}</DescriptionListTerm>
          <DescriptionListDescription>
            {describeValue({ field, settings, domain })}
          </DescriptionListDescription>
        </DescriptionListGroup>
      ))}
    </DescriptionList>
  );
};
