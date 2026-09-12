import { useMemo, useState, type Ref } from "react";

import {
  Divider,
  MenuSearch,
  MenuSearchInput,
  MenuToggle,
  type MenuToggleElement,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
} from "@patternfly/react-core";

export interface ITypeaheadOption {
  value: string;
  label: string;
}

interface ITypeaheadSelectProps {
  id: string;
  ariaLabel: string;
  placeholder?: string;
  options: ITypeaheadOption[];
  value: string;
  onChange: (value: string) => void;
  isDisabled?: boolean;
}

/** Single-select typeahead built on PatternFly Select. */
export function TypeaheadSelect({
  id,
  ariaLabel,
  placeholder = "Select…",
  options,
  value,
  onChange,
  isDisabled,
}: ITypeaheadSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? value;

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) {
      return options;
    }
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query),
    );
  }, [filter, options]);

  return (
    <Select
      id={id}
      isOpen={isOpen}
      selected={value}
      onOpenChange={(next) => {
        setIsOpen(next);
        if (!next) {
          setFilter("");
        }
      }}
      onSelect={(_event, selectedValue) => {
        onChange(String(selectedValue ?? ""));
        setIsOpen(false);
        setFilter("");
      }}
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          id={`${id}-toggle`}
          aria-label={ariaLabel}
          onClick={() => setIsOpen((open) => !open)}
          isExpanded={isOpen}
          isDisabled={isDisabled}
          isFullWidth
        >
          {value ? selectedLabel : placeholder}
        </MenuToggle>
      )}
    >
      <MenuSearch>
        <MenuSearchInput>
          <SearchInput
            id={`${id}-filter`}
            aria-label={`${ariaLabel} filter`}
            value={filter}
            onChange={(_e, next) => setFilter(next)}
            placeholder="Filter…"
            onClear={() => setFilter("")}
          />
        </MenuSearchInput>
      </MenuSearch>
      <Divider />
      <SelectList>
        {filtered.map((option) => (
          <SelectOption key={option.value} value={option.value}>
            {option.label}
          </SelectOption>
        ))}
        {filtered.length === 0 && (
          <SelectOption isDisabled>No matches</SelectOption>
        )}
      </SelectList>
    </Select>
  );
}
