import React from "react";

import type { DistributionResponse } from "@app/client";
import {
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  InputGroup,
  InputGroupItem,
  MenuSearch,
  MenuSearchInput,
  MenuToggle,
  SearchInput,
  type MenuToggleElement,
} from "@patternfly/react-core";

interface IDistributionSelectorProps {
  distributions: DistributionResponse[];
  selected: DistributionResponse | null;
  onChange: (selected: DistributionResponse) => void;
}

export const DistributionSelector: React.FC<IDistributionSelectorProps> = ({
  distributions,
  selected,
  onChange,
}) => {
  const menuRef = React.useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [searchInputValue, setSearchInputValue] = React.useState<string>("");

  const filteredOptions = React.useMemo(() => {
    if (!searchInputValue) {
      return distributions;
    }
    return distributions.filter((item) =>
      item.name.toLowerCase().includes(searchInputValue.toLowerCase()),
    );
  }, [distributions, searchInputValue]);

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    if (
      typeof value === "number" ||
      typeof value === "string" ||
      typeof value === "undefined"
    ) {
      return;
    }

    const newValue = value as DistributionResponse;
    setIsOpen(!isOpen);
    setSearchInputValue(""); // Clear search
    onChange(newValue);
  };

  const onSearchInputChange = (value: string) => {
    setSearchInputValue(value);
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => {
    let displayText = "Select a distribution";
    if (selected) {
      displayText = selected.name;
    }
    return (
      <MenuToggle
        ref={toggleRef}
        aria-label="distribution-select"
        // isFullWidth
        onClick={onToggleClick}
        isExpanded={isOpen}
      >
        {displayText}
      </MenuToggle>
    );
  };

  return (
    <Dropdown
      ref={menuRef}
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={(isOpen) => {
        setIsOpen(isOpen);
        if (!isOpen) {
          setSearchInputValue(""); // Clear search when closing
        }
      }}
      onOpenChangeKeys={["Escape"]}
      toggle={toggle}
      shouldFocusToggleOnSelect
      isScrollable
    >
      <MenuSearch>
        <MenuSearchInput>
          <InputGroup>
            <InputGroupItem isFill>
              <SearchInput
                value={searchInputValue}
                placeholder="Search"
                onChange={(_event, value) => onSearchInputChange(value)}
              />
            </InputGroupItem>
          </InputGroup>
        </MenuSearchInput>
      </MenuSearch>
      <Divider />
      <DropdownList>
        {filteredOptions.length > 0 ? (
          filteredOptions.map((item) => {
            const isSelected = selected?.name === item.name;
            return (
              <DropdownItem
                key={item.name}
                itemId={item}
                isSelected={isSelected}
              >
                {item.name}
              </DropdownItem>
            );
          })
        ) : (
          <DropdownItem isDisabled>No results found</DropdownItem>
        )}
      </DropdownList>
    </Dropdown>
  );
};
