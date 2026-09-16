import type React from "react";
import { useState } from "react";

import {
  Dropdown,
  DropdownItem,
  type DropdownItemProps,
  DropdownList,
  MenuToggle,
  type MenuToggleElement,
} from "@patternfly/react-core";
import { EllipsisVIcon } from "@patternfly/react-icons";

export type PageHeaderAction = {
  /** Stable identifier for the item (React key). */
  key: string;
  /** Props forwarded to PatternFly's DropdownItem; use `children` for the label. */
  dropdownItemProps: DropdownItemProps;
};

interface IPageHeaderActionsMenuProps {
  /** Actions to render; falsy entries are ignored so callers can inline conditions. */
  actions: (PageHeaderAction | false | null | undefined)[];
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
    (action): action is PageHeaderAction => !!action,
  );
  if (items.length === 0) return null;

  return (
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
      <DropdownList>
        {items.map(({ key, dropdownItemProps }) => (
          <DropdownItem key={key} {...dropdownItemProps} />
        ))}
      </DropdownList>
    </Dropdown>
  );
};
