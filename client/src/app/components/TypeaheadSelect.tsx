import type React from "react";
import { type Ref, useState } from "react";

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
  Spinner,
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
  /**
   * When set, the caller drives filtering server-side: typed text is forwarded
   * here (debounce caller-side) and `options` are rendered as-is.
   */
  onFilterChange?: (value: string) => void;
  /** Show a loading indicator in the menu (server-side options in flight). */
  isLoading?: boolean;
  /** Notified when the menu opens/closes, so callers can lazily enable fetching. */
  onOpenChange?: (isOpen: boolean) => void;
  /**
   * Label for the current `value` when it is not present in `options` (e.g. the
   * selection is outside the current server-filtered page).
   */
  selectedLabel?: string;
  /** Whether the toggle stretches to its container (default true, for forms). */
  isToggleFullWidth?: boolean;
  /** When set and a value is selected, the menu offers this option to clear it. */
  clearLabel?: string;
}

/** Single-select typeahead built on PatternFly Select. */
export const TypeaheadSelect: React.FC<ITypeaheadSelectProps> = ({
  id,
  ariaLabel,
  placeholder = "Select…",
  options,
  value,
  onChange,
  isDisabled,
  onFilterChange,
  isLoading,
  onOpenChange,
  selectedLabel: selectedLabelProp,
  isToggleFullWidth = true,
  clearLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  // Keep the last picked option so the toggle still shows its label after a new
  // search filters it out of `options` (server-filtered case).
  const [lastSelected, setLastSelected] = useState<ITypeaheadOption>();

  const isServerFiltered = !!onFilterChange;

  const selectedLabel =
    options.find((option) => option.value === value)?.label ??
    (lastSelected?.value === value ? lastSelected.label : undefined) ??
    selectedLabelProp ??
    value;

  const setSearch = (next: string) => {
    setFilter(next);
    onFilterChange?.(next);
  };

  const query = filter.trim().toLowerCase();
  const filtered =
    isServerFiltered || !query
      ? options
      : options.filter(
          (option) =>
            option.label.toLowerCase().includes(query) ||
            option.value.toLowerCase().includes(query),
        );

  return (
    <Select
      id={id}
      isOpen={isOpen}
      selected={value}
      onOpenChange={(next) => {
        setIsOpen(next);
        onOpenChange?.(next);
        if (!next) {
          setSearch("");
        }
      }}
      onSelect={(_event, selectedValue) => {
        const nextValue = String(selectedValue ?? "");
        setLastSelected(options.find((option) => option.value === nextValue));
        onChange(nextValue);
        setIsOpen(false);
        setSearch("");
      }}
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          id={`${id}-toggle`}
          aria-label={ariaLabel}
          onClick={() => {
            const next = !isOpen;
            setIsOpen(next);
            onOpenChange?.(next);
          }}
          isExpanded={isOpen}
          isDisabled={isDisabled}
          isFullWidth={isToggleFullWidth}
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
            onChange={(_e, next) => setSearch(next)}
            placeholder="Filter…"
            onClear={() => setSearch("")}
          />
        </MenuSearchInput>
      </MenuSearch>
      <Divider />
      <SelectList>
        {clearLabel && value && (
          <SelectOption value="">{clearLabel}</SelectOption>
        )}
        {isLoading && (
          <SelectOption isDisabled>
            <Spinner size="sm" aria-label="Loading options" /> Loading…
          </SelectOption>
        )}
        {!isLoading &&
          filtered.map((option) => (
            <SelectOption key={option.value} value={option.value}>
              {option.label}
            </SelectOption>
          ))}
        {!isLoading && filtered.length === 0 && (
          <SelectOption isDisabled>No matches</SelectOption>
        )}
      </SelectList>
    </Select>
  );
};
