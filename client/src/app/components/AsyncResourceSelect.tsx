import { useState } from "react";

import type { EntityType } from "@catalog";
import { TypeaheadSelect } from "@app/components/TypeaheadSelect";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useResourceSearch } from "@app/hooks/pluginForm/useResourceSearch";

interface IAsyncResourceSelectProps {
  id: string;
  label: string;
  resourceKind: EntityType;
  value: string;
  onChange: (value: string) => void;
  /** Compatibility predicate restricting which hrefs are offered. */
  filter?: (href: string) => boolean;
}

/**
 * Picker for an `asyncResource` field: a server-side typeahead that loads options
 * only while the dropdown is open and refines them as the user types (debounced).
 * Nothing is fetched until the user opens it, and the selected value's label is
 * resolved separately so it shows correctly in edit mode even when outside the
 * current search page.
 */
export const AsyncResourceSelect = ({
  id,
  label,
  resourceKind,
  value,
  onChange,
  filter,
}: IAsyncResourceSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebouncedValue(term);

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
