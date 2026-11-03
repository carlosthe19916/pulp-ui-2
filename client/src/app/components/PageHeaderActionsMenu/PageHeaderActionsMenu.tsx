import type React from "react";
import { useState } from "react";

import {
  Dropdown,
  DropdownItem,
  type DropdownItemProps,
  DropdownList,
  MenuToggle,
  type MenuToggleElement,
  OverflowMenu,
  OverflowMenuContent,
  OverflowMenuControl,
  OverflowMenuDropdownItem,
  OverflowMenuItem,
} from "@patternfly/react-core";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";

import { GatedButton } from "@app/components/GatedButton";

export interface IPageHeaderAction {
  /** Stable identifier for the item (React key). */
  key: string;
  /** Props forwarded to PatternFly's DropdownItem; use `children` for the label. */
  dropdownItemProps: DropdownItemProps;
  /** Shown as a button beside the kebab on wide screens; folds into the kebab on narrow ones. */
  isPromoted?: boolean;
}

interface IPageHeaderActionsMenuProps {
  /** Actions to render; falsy entries are ignored so callers can inline conditions. */
  actions: (IPageHeaderAction | false | null | undefined)[];
  ouiaId?: string;
}

/**
 * Kebab (overflow) menu for a `PageHeader`'s `actionMenu` prop. Renders nothing
 * when no actions are provided.
 */
export const PageHeaderActionsMenu: React.FC<IPageHeaderActionsMenuProps> = ({
  actions,
  ouiaId = "page-header-actions",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const items = actions.filter(
    (action): action is IPageHeaderAction => !!action,
  );
  if (items.length === 0) return null;

  const promoted = items.filter((item) => item.isPromoted);

  const kebab = (children: React.ReactNode) => (
    <Dropdown
      isOpen={isOpen}
      onSelect={() => setIsOpen(false)}
      onOpenChange={(open) => setIsOpen(open)}
      popperProps={{ position: "right" }}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          aria-label="Actions"
          variant="plain"
          isExpanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          ouiaId={ouiaId}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
    >
      <DropdownList>{children}</DropdownList>
    </Dropdown>
  );

  if (promoted.length === 0) {
    return kebab(
      items.map(({ key, dropdownItemProps }) => (
        <DropdownItem key={key} {...dropdownItemProps} />
      )),
    );
  }

  return (
    <OverflowMenu breakpoint="md">
      <OverflowMenuContent>
        {promoted.map(({ key, dropdownItemProps }) => (
          <OverflowMenuItem key={key}>
            <GatedButton
              variant="secondary"
              onClick={dropdownItemProps.onClick}
              isDisabled={dropdownItemProps.isDisabled}
              isAriaDisabled={dropdownItemProps.isAriaDisabled}
              tooltipProps={dropdownItemProps.tooltipProps}
            >
              {dropdownItemProps.children}
            </GatedButton>
          </OverflowMenuItem>
        ))}
      </OverflowMenuContent>
      <OverflowMenuControl
        hasAdditionalOptions={promoted.length < items.length}
      >
        {kebab(
          items.map(({ key, dropdownItemProps, isPromoted }) => (
            <OverflowMenuDropdownItem
              key={key}
              isShared={isPromoted}
              {...dropdownItemProps}
            />
          )),
        )}
      </OverflowMenuControl>
    </OverflowMenu>
  );
};
