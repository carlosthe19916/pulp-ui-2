import type React from "react";
import { useState } from "react";

import type { ResourceKind } from "@catalog";

import { Label, LabelGroup, Stack, StackItem } from "@patternfly/react-core";

import { TypeaheadSelect } from "@app/components/TypeaheadSelect";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";

import { useResourceSearch } from "./useResourceSearch";

interface IAsyncResourceSelectProps {
  id: string;
  label: string;
  resourceKind: ResourceKind;
  value: string;
  onChange: (value: string) => void;
  /** Compatibility predicate restricting which hrefs are offered. */
  filter?: (href: string) => boolean;
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
  filter,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebouncedValue({ value: term });

  const { options, isLoading, selectedLabel } = useResourceSearch({
    resourceKind,
    term: debouncedTerm,
    selectedHref: value,
    enabled: isOpen,
    filter,
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
  filter?: (href: string) => boolean;
}

/**
 * Multi-value `asyncResource` picker: the same typeahead adds a pick, and the
 * picks show as removable labels.
 */
export const AsyncResourceMultiSelect: React.FC<
  IAsyncResourceMultiSelectProps
> = ({ id, label, resourceKind, value, onChange, filter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebouncedValue({ value: term });
  // Names of the picks, remembered when picked (a pick may leave the search page).
  const [names, setNames] = useState<Record<string, string>>({});

  const { options, isLoading } = useResourceSearch({
    resourceKind,
    term: debouncedTerm,
    selectedHref: "",
    enabled: isOpen,
    filter: (href) => !value.includes(href) && (!filter || filter(href)),
  });

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
          isLoading={isLoading}
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
