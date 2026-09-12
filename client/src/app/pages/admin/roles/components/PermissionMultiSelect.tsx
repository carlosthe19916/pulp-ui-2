import { useMemo, useState, type Ref } from "react";

import {
  Button,
  Divider,
  Label,
  LabelGroup,
  MenuSearch,
  MenuSearchInput,
  MenuToggle,
  type MenuToggleElement,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  TextInput,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

interface IPermissionMultiSelectProps {
  id: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  isDisabled?: boolean;
}

/** Searchable multi-select for role permissions, with custom add escape hatch. */
export function PermissionMultiSelect({
  id,
  options,
  value,
  onChange,
  isDisabled,
}: IPermissionMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [customPermission, setCustomPermission] = useState("");

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) {
      return options;
    }
    return options.filter((permission) =>
      permission.toLowerCase().includes(query),
    );
  }, [filter, options]);

  const togglePermission = (permission: string) => {
    if (value.includes(permission)) {
      onChange(value.filter((item) => item !== permission));
      return;
    }
    onChange([...value, permission].sort((a, b) => a.localeCompare(b)));
  };

  const addCustom = () => {
    const permission = customPermission.trim();
    if (!permission) {
      return;
    }
    if (!value.includes(permission)) {
      onChange([...value, permission].sort((a, b) => a.localeCompare(b)));
    }
    setCustomPermission("");
  };

  return (
    <>
      {value.length > 0 && (
        <LabelGroup className={spacing.mbSm}>
          {value.map((permission) => (
            <Label
              key={permission}
              isCompact
              onClose={
                isDisabled
                  ? undefined
                  : () => onChange(value.filter((item) => item !== permission))
              }
            >
              {permission}
            </Label>
          ))}
        </LabelGroup>
      )}

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
          togglePermission(String(selectedValue ?? ""));
        }}
        toggle={(toggleRef: Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            id={`${id}-toggle`}
            aria-label="Select permissions"
            onClick={() => setIsOpen((open) => !open)}
            isExpanded={isOpen}
            isDisabled={isDisabled}
            isFullWidth
          >
            {value.length > 0
              ? `${value.length} permission${value.length === 1 ? "" : "s"} selected`
              : "Select permissions"}
          </MenuToggle>
        )}
      >
        <MenuSearch>
          <MenuSearchInput>
            <SearchInput
              id={`${id}-filter`}
              aria-label="Filter permissions"
              value={filter}
              onChange={(_e, next) => setFilter(next)}
              placeholder="Filter permissions…"
              onClear={() => setFilter("")}
            />
          </MenuSearchInput>
        </MenuSearch>
        <Divider />
        <SelectList isAriaMultiselectable>
          {filtered.map((permission) => (
            <SelectOption
              key={permission}
              value={permission}
              hasCheckbox
              isSelected={value.includes(permission)}
            >
              {permission}
            </SelectOption>
          ))}
          {filtered.length === 0 && (
            <SelectOption isDisabled>No matches</SelectOption>
          )}
        </SelectList>
      </Select>

      <TextInputGroup className={spacing.mtSm}>
        <TextInputGroupMain>
          <TextInput
            id={`${id}-custom`}
            aria-label="Add custom permission"
            value={customPermission}
            onChange={(_e, next) => setCustomPermission(next)}
            placeholder="Add custom permission…"
            isDisabled={isDisabled}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustom();
              }
            }}
          />
        </TextInputGroupMain>
        <TextInputGroupUtilities>
          <Button
            variant="control"
            onClick={addCustom}
            isDisabled={isDisabled || !customPermission.trim()}
          >
            Add
          </Button>
        </TextInputGroupUtilities>
      </TextInputGroup>
    </>
  );
}
