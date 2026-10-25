import type React from "react";
import { useReducer, useState } from "react";

import {
  Brand,
  Button,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  Icon,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadLogo,
  MastheadMain,
  MastheadToggle,
  MenuToggle,
  type MenuToggleElement,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
} from "@patternfly/react-core";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import RhUiQuestionMarkCircleFillIcon from "@patternfly/react-icons/dist/esm/icons/rh-ui-question-mark-circle-fill-icon";
import UserIcon from "@patternfly/react-icons/dist/esm/icons/user-icon";

import { ThemeSelector } from "@app/components/ThemeSelector";
import { ENV } from "@app/env";
import { useAuth } from "@app/hooks/useAuth";
import { getBranding } from "@app/utils/branding";

import { AboutApp } from "./AboutApp";
import { BrandLogo } from "./BrandLogo";
import { NavApp } from "./NavApp";

export const DOCK_ID = "docked-masthead";

const HELP_TOGGLE_ID = "dock-help-toggle";
const USER_TOGGLE_ID = "dock-user-toggle";

// Dock menus open beside the dock rather than over it.
const DOCK_MENU_POPPER = { placement: "right-end" } as const;

interface IDockAppProps {
  isDockExpanded: boolean;
  /** The dock is off screen (mobile, collapsed): keep it out of focus and the a11y tree. */
  isHidden: boolean;
  onToggleDock: () => void;
  onOpenDock: () => void;
  onNavSelect: () => void;
}

/** The vertical masthead of the docked layout: brand, navigation and user tools. */
export const DockApp: React.FC<IDockAppProps> = ({
  isDockExpanded,
  isHidden,
  onToggleDock,
  onOpenDock,
  onNavSelect,
}) => {
  const auth = useAuth();
  const {
    masthead: { rightBrand, supportUrl },
  } = getBranding();

  const [isAboutModalOpen, toggleIsAboutModalOpen] = useReducer(
    (state) => !state,
    false,
  );
  const [isHelpDropdownOpen, setIsHelpDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const isLoggedIn = ENV.AUTH !== "none" && !!auth?.isAuthenticated();

  return (
    <>
      <AboutApp isOpen={isAboutModalOpen} onClose={toggleIsAboutModalOpen} />

      <Masthead id={DOCK_ID} variant="docked" inert={isHidden}>
        <MastheadMain>
          <MastheadToggle>
            <Button
              variant="plain"
              isHamburger
              onClick={onToggleDock}
              aria-label="Global navigation"
              isExpanded={isDockExpanded}
            />
          </MastheadToggle>
          <MastheadBrand>
            <MastheadLogo isCompact>
              <BrandLogo isCompact />
            </MastheadLogo>
            <MastheadLogo>
              <BrandLogo />
            </MastheadLogo>
          </MastheadBrand>
        </MastheadMain>
        <Divider />
        <MastheadContent>
          <Toolbar isVertical>
            <ToolbarContent>
              <ToolbarItem>
                <NavApp
                  isDockExpanded={isDockExpanded}
                  onOpenDock={onOpenDock}
                  onSelect={onNavSelect}
                />
              </ToolbarItem>
              <ToolbarGroup
                variant="action-group-plain"
                align={{ default: "alignEnd" }}
                gap={{ default: "gapNone", md: "gapMd" }}
              >
                <ToolbarItem>
                  <Dropdown
                    isOpen={isHelpDropdownOpen}
                    onSelect={() => setIsHelpDropdownOpen(false)}
                    onOpenChange={setIsHelpDropdownOpen}
                    popperProps={DOCK_MENU_POPPER}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        id={HELP_TOGGLE_ID}
                        onClick={() =>
                          setIsHelpDropdownOpen(!isHelpDropdownOpen)
                        }
                        isExpanded={isHelpDropdownOpen}
                        variant="plain"
                        icon={<RhUiQuestionMarkCircleFillIcon />}
                        isDocked
                        aria-label="Help"
                      >
                        Help
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      {supportUrl && (
                        <DropdownItem
                          key="support"
                          component="a"
                          to={supportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Support{" "}
                          <Icon isInline iconSize="sm">
                            <ExternalLinkAltIcon />
                          </Icon>
                        </DropdownItem>
                      )}
                      <DropdownItem
                        key="about"
                        onClick={toggleIsAboutModalOpen}
                      >
                        About
                      </DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </ToolbarItem>
                <ToolbarItem>
                  <ThemeSelector id="theme-selector-dock" isDocked />
                </ToolbarItem>
                {isLoggedIn && (
                  <ToolbarItem>
                    <Dropdown
                      isOpen={isUserDropdownOpen}
                      onSelect={() => setIsUserDropdownOpen(false)}
                      onOpenChange={setIsUserDropdownOpen}
                      popperProps={DOCK_MENU_POPPER}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          id={USER_TOGGLE_ID}
                          onClick={() =>
                            setIsUserDropdownOpen(!isUserDropdownOpen)
                          }
                          isExpanded={isUserDropdownOpen}
                          variant="plain"
                          icon={<UserIcon />}
                          isDocked
                          aria-label={auth?.user?.username ?? "User"}
                        >
                          {auth?.user?.username}
                        </MenuToggle>
                      )}
                    >
                      <DropdownList>
                        <DropdownItem
                          key="logout"
                          onClick={() => auth?.logout()}
                        >
                          Log out
                        </DropdownItem>
                      </DropdownList>
                    </Dropdown>
                  </ToolbarItem>
                )}
                {rightBrand ? (
                  <ToolbarItem>
                    <Brand
                      src={rightBrand.src}
                      alt={rightBrand.alt}
                      heights={{ default: rightBrand.height }}
                    />
                  </ToolbarItem>
                ) : null}
              </ToolbarGroup>
              {!isDockExpanded && (
                <>
                  <Tooltip
                    aria="none"
                    aria-live="off"
                    triggerRef={() => document.getElementById(HELP_TOGGLE_ID)!}
                    content="Help"
                  />
                  {isLoggedIn && (
                    <Tooltip
                      aria="none"
                      aria-live="off"
                      triggerRef={() =>
                        document.getElementById(USER_TOGGLE_ID)!
                      }
                      content={auth?.user?.username}
                    />
                  )}
                </>
              )}
            </ToolbarContent>
          </Toolbar>
        </MastheadContent>
      </Masthead>
    </>
  );
};
