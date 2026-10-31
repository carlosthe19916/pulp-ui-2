import type React from "react";
import { useState } from "react";

import { Label, LabelGroup, Stack, StackItem } from "@patternfly/react-core";

import { TypeaheadSelect } from "@app/components/TypeaheadSelect";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import type { ResourceKind } from "@app/utils/entityField";

import { useResourceSearch } from "./useResourceSearch";

interface IAsyncResourceSelectProps {
  id: string;
  label: string;
  resourceKind: ResourceKind;
  value: string;
  onChange: (value: string) => void;
  /** Compatible pulp_types, filtered server-side; unset offers every type. */
  pulpTypes?: string[];
}

/**
 * Server-side typeahead for an `asyncResource` field; fetches only while open and refines
 * (debounced) as the user types.
 */
export const AsyncResourceSelect: React.FC<IAsyncResourceSelectProps> = ({
  id,
  label,
  resourceKind,
  value,
  onChange,
  pulpTypes,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebouncedValue({ value: term });

  const { options, isLoading, selectedLabel } = useResourceSearch({
    resourceKind,
    term: debouncedTerm,
    selectedHref: value,
    enabled: isOpen,
    pulpTypes,
  });

  return (
    <TypeaheadSelect
      id={id}
      ariaLabel={label}
      placeholder={`Select ${label.toLowerCase()}…`}
      options={options}
      value={value}
      onChange={onChange}
      onFilterChange={setTerm}
      onOpenChange={setIsOpen}
      isLoading={isLoading}
      selectedLabel={selectedLabel}
    />
  );
};

interface IAsyncResourceMultiSelectProps {
  id: string;
  label: string;
  resourceKind: ResourceKind;
  value: string[];
  onChange: (value: string[]) => void;
  /** Compatible pulp_types, filtered server-side; unset offers every type. */
  pulpTypes?: string[];
}

/**
 * Multi-value `asyncResource` picker: the same typeahead adds a pick, and the
 * picks show as removable labels.
 */
export const AsyncResourceMultiSelect: React.FC<
  IAsyncResourceMultiSelectProps
> = ({ id, label, resourceKind, value, onChange, pulpTypes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebouncedValue({ value: term });
  // Names of the picks, remembered when picked (a pick may leave the search page).
  const [names, setNames] = useState<Record<string, string>>({});

  const search = useResourceSearch({
    resourceKind,
    term: debouncedTerm,
    selectedHref: "",
    enabled: isOpen,
    pulpTypes,
  });
  // Already-picked items stay out of the menu.
  const options = search.options.filter(
    (option) => !value.includes(option.value),
  );

  return (
    <Stack hasGutter>
      <StackItem>
        <TypeaheadSelect
          id={id}
          ariaLabel={label}
          placeholder={`Add ${label.toLowerCase()}…`}
          options={options}
          value=""
          onChange={(href) => {
            if (!href) return;
            const option = options.find((item) => item.value === href);
            setNames((current) => ({
              ...current,
              [href]: option?.label ?? href,
            }));
            onChange([...value, href]);
          }}
          onFilterChange={setTerm}
          onOpenChange={setIsOpen}
          isLoading={search.isLoading}
        />
      </StackItem>
      {value.length > 0 && (
        <StackItem>
          <LabelGroup numLabels={10}>
            {value.map((href) => (
              <Label
                key={href}
                onClose={() => onChange(value.filter((item) => item !== href))}
              >
                {names[href] ?? href}
              </Label>
            ))}
          </LabelGroup>
        </StackItem>
      )}
    </Stack>
  );
};
