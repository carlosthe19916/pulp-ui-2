import type React from "react";
import { type Ref, useState } from "react";

import {
  Badge,
  Divider,
  MenuSearch,
  MenuSearchInput,
  MenuToggle,
  type MenuToggleElement,
  SearchInput,
  Select,
  SelectGroup,
  SelectList,
  SelectOption,
  ToolbarFilter,
  type ToolbarLabel,
} from "@patternfly/react-core";
import FilterIcon from "@patternfly/react-icons/dist/esm/icons/filter-icon";

/** A selectable option; `group` (optional) buckets it under a labelled section. */
export interface IMultiSelectOption {
  label: string;
  value: string;
  group?: string;
}

/** Stable empty default so the component doesn't get a new array each render. */
const NO_SELECTION: string[] = [];

interface IMultiSelectFilterProps {
  /** All selectable options; give each a `group` to render grouped sections. */
  options: IMultiSelectOption[];
  /** Placeholder for the in-menu search box. */
  searchPlaceholder?: string;
  /** Scrolling cap for the option list (default "300px"). */
  maxMenuHeight?: string;
  // --- Identity read by DataViewFilters (must be passed on the element) ---
  filterId: string;
  title: string;
  // --- Injected by DataViewFilters via cloneElement ---
  value?: string[];
  onChange?: (event: unknown, value: string[]) => void;
  showToolbarItem?: boolean;
}

/**
 * Searchable, scrollable, grouped multi-select filter for `DataViewFilters`; like
 * `DataViewCheckboxFilter`, its `ToolbarFilter` lets DataView manage chips.
 */
export const MultiSelectFilter: React.FC<IMultiSelectFilterProps> = ({
  options,
  searchPlaceholder = "Search…",
  maxMenuHeight = "300px",
  filterId,
  title,
  value = NO_SELECTION,
  onChange,
  showToolbarItem,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const filtered = query
    ? options.filter(
        (option) =>
          option.label.toLowerCase().includes(query) ||
          option.value.toLowerCase().includes(query),
      )
    : options;

  const groups: { group?: string; options: IMultiSelectOption[] }[] = [];
  const index = new Map<string | undefined, IMultiSelectOption[]>();
  for (const option of filtered) {
    let bucket = index.get(option.group);
    if (!bucket) {
      bucket = [];
      index.set(option.group, bucket);
      groups.push({ group: option.group, options: bucket });
    }
    bucket.push(option);
  }
  const hasGroups = groups.some((bucket) => bucket.group != null);

  const toggleValue = (optionValue: string) => {
    const next = value.includes(optionValue)
      ? value.filter((item) => item !== optionValue)
      : [...value, optionValue];
    onChange?.(undefined, next);
  };

  const labels: ToolbarLabel[] = value.map((item) => ({
    key: item,
    node: options.find((option) => option.value === item)?.label ?? item,
  }));

  const renderOption = (option: IMultiSelectOption) => (
    <SelectOption
      key={option.value}
      value={option.value}
      hasCheckbox
      isSelected={value.includes(option.value)}
    >
      {option.label}
    </SelectOption>
  );

  return (
    <ToolbarFilter
      labels={labels}
      deleteLabel={(_category, label) => {
        const key = typeof label === "string" ? label : label.key;
        onChange?.(
          undefined,
          value.filter((item) => item !== key),
        );
      }}
      categoryName={title}
      showToolbarItem={showToolbarItem}
    >
      <Select
        isOpen={isOpen}
        selected={value}
        isScrollable
        maxMenuHeight={maxMenuHeight}
        onOpenChange={(next) => {
          setIsOpen(next);
          if (!next) setSearch("");
        }}
        onSelect={(_event, selectedValue) =>
          toggleValue(String(selectedValue ?? ""))
        }
        toggle={(toggleRef: Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            id={`${filterId}-filter-toggle`}
            aria-label={title}
            icon={<FilterIcon />}
            badge={
              value.length > 0 ? (
                <Badge isRead>{value.length}</Badge>
              ) : undefined
            }
            onClick={() => setIsOpen((open) => !open)}
            isExpanded={isOpen}
          >
            {title}
          </MenuToggle>
        )}
      >
        <MenuSearch>
          <MenuSearchInput>
            <SearchInput
              aria-label={`${title} filter`}
              value={search}
              onChange={(_e, next) => setSearch(next)}
              onClear={() => setSearch("")}
              placeholder={searchPlaceholder}
            />
          </MenuSearchInput>
        </MenuSearch>
        <Divider />
        {filtered.length === 0 ? (
          <SelectList>
            <SelectOption isDisabled>No matches</SelectOption>
          </SelectList>
        ) : hasGroups ? (
          groups.map(({ group, options: groupOptions }) =>
            group == null ? (
              <SelectList key="__ungrouped">
                {groupOptions.map(renderOption)}
              </SelectList>
            ) : (
              <SelectGroup key={group} label={group}>
                <SelectList>{groupOptions.map(renderOption)}</SelectList>
              </SelectGroup>
            ),
          )
        ) : (
          <SelectList>{filtered.map(renderOption)}</SelectList>
        )}
      </Select>
    </ToolbarFilter>
  );
};
