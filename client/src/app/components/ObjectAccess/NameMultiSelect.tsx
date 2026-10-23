import type React from "react";
import { useState } from "react";

import { Label, LabelGroup, Stack, StackItem } from "@patternfly/react-core";

import { TypeaheadSelect } from "@app/components/TypeaheadSelect";

interface INameMultiSelectProps {
  id: string;
  label: string;
  /** The names matching the current search (server-side). */
  options: string[];
  isLoading: boolean;
  onSearch: (term: string) => void;
  value: string[];
  onChange: (value: string[]) => void;
}

/** Pick several users or groups by name: a typeahead plus removable labels. */
export const NameMultiSelect: React.FC<INameMultiSelectProps> = ({
  id,
  label,
  options,
  isLoading,
  onSearch,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Stack hasGutter>
      <StackItem>
        <TypeaheadSelect
          id={id}
          ariaLabel={label}
          placeholder={`Add ${label.toLowerCase()}…`}
          options={
            isOpen
              ? options
                  .filter((name) => !value.includes(name))
                  .map((name) => ({ value: name, label: name }))
              : []
          }
          value=""
          onChange={(name) => {
            if (name) onChange([...value, name]);
          }}
          onFilterChange={onSearch}
          onOpenChange={setIsOpen}
          isLoading={isLoading}
        />
      </StackItem>
      {value.length > 0 && (
        <StackItem>
          <LabelGroup numLabels={10}>
            {value.map((name) => (
              <Label
                key={name}
                onClose={() => onChange(value.filter((item) => item !== name))}
              >
                {name}
              </Label>
            ))}
          </LabelGroup>
        </StackItem>
      )}
    </Stack>
  );
};
