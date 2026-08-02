import { useMemo, useState, type Ref } from "react";

import {
  MenuToggle,
  type MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Button,
  TextInput,
} from "@patternfly/react-core";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";

export interface TypeaheadOption {
  value: string;
  label: string;
}

interface TypeaheadSelectProps {
  id: string;
  ariaLabel: string;
  placeholder?: string;
  options: TypeaheadOption[];
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
}: TypeaheadSelectProps) {
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
      <SelectList>
        <TextInputGroup>
          <TextInputGroupMain>
            <TextInput
              id={`${id}-filter`}
              aria-label={`${ariaLabel} filter`}
              value={filter}
              onChange={(_e, next) => setFilter(next)}
              placeholder="Filter…"
            />
          </TextInputGroupMain>
          <TextInputGroupUtilities>
            {filter ? (
              <Button
                variant="plain"
                aria-label="Clear filter"
                onClick={() => setFilter("")}
              >
                <TimesIcon />
              </Button>
            ) : null}
          </TextInputGroupUtilities>
        </TextInputGroup>
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
