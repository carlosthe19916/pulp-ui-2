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
   * When provided, the caller drives filtering server-side: the typed search
   * text is forwarded here (debounce on the caller side) and `options` are
   * rendered as-is instead of being filtered locally.
   */
  onFilterChange?: (value: string) => void;
  /** Show a loading indicator in the menu (server-side options in flight). */
  isLoading?: boolean;
  /**
   * Label to show for the current `value` when it is not present in `options`
   * (e.g. the selected item is outside the current server-filtered page).
   */
  selectedLabel?: string;
}

/** Single-select typeahead built on PatternFly Select. */
export const TypeaheadSelect = ({
  id,
  ariaLabel,
  placeholder = "Select…",
  options,
  value,
  onChange,
  isDisabled,
  onFilterChange,
  isLoading,
  selectedLabel: selectedLabelProp,
}: ITypeaheadSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  // Remember the last option picked from the menu so the toggle keeps showing
  // its label even after a new search filters it out of `options` (relevant
  // when options are server-filtered).
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

  const filtered = useMemo(() => {
    if (isServerFiltered) {
      return options;
    }
    const query = filter.trim().toLowerCase();
    if (!query) {
      return options;
    }
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query),
    );
  }, [filter, options, isServerFiltered]);

  return (
    <Select
      id={id}
      isOpen={isOpen}
      selected={value}
      onOpenChange={(next) => {
        setIsOpen(next);
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
            onChange={(_e, next) => setSearch(next)}
            placeholder="Filter…"
            onClear={() => setSearch("")}
          />
        </MenuSearchInput>
      </MenuSearch>
      <Divider />
      <SelectList>
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
