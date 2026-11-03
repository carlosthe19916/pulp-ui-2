import type React from "react";
import { useReducer, useState } from "react";

import {
  Brand,
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
  PageToggleButton,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
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
import { TaskDrawerBadge } from "./TaskDrawer";

interface IHeaderAppProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  isTaskDrawerExpanded: boolean;
  onToggleTaskDrawer: () => void;
}

/** The masthead: sidebar toggle, brand, and the tasks, help, theme and user menus. */
export const HeaderApp: React.FC<IHeaderAppProps> = ({
  isSidebarOpen,
  onSidebarToggle,
  isTaskDrawerExpanded,
  onToggleTaskDrawer,
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

      <Masthead>
        <MastheadMain>
          <MastheadToggle>
            <PageToggleButton
              variant="plain"
              aria-label="Global navigation"
              isSidebarOpen={isSidebarOpen}
              onSidebarToggle={onSidebarToggle}
              isHamburgerButton
            />
          </MastheadToggle>
          <MastheadBrand>
            <MastheadLogo>
              <BrandLogo />
            </MastheadLogo>
          </MastheadBrand>
        </MastheadMain>
        <MastheadContent>
          <Toolbar isFullHeight isStatic>
            <ToolbarContent>
              <ToolbarGroup
                variant="action-group-plain"
                align={{ default: "alignEnd" }}
                gap={{ default: "gapNone", md: "gapMd" }}
              >
                {isLoggedIn && (
                  <ToolbarItem>
                    <TaskDrawerBadge
                      isExpanded={isTaskDrawerExpanded}
                      onToggle={onToggleTaskDrawer}
                    />
                  </ToolbarItem>
                )}
                <ToolbarItem>
                  <Dropdown
                    isOpen={isHelpDropdownOpen}
                    onSelect={() => setIsHelpDropdownOpen(false)}
                    onOpenChange={setIsHelpDropdownOpen}
                    popperProps={{ position: "right" }}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() =>
                          setIsHelpDropdownOpen(!isHelpDropdownOpen)
                        }
                        isExpanded={isHelpDropdownOpen}
                        variant="plain"
                        icon={<RhUiQuestionMarkCircleFillIcon />}
                        aria-label="Help"
                      />
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
                  <ThemeSelector id="theme-selector-masthead" />
                </ToolbarItem>
              </ToolbarGroup>
              {isLoggedIn && (
                <ToolbarGroup variant="action-group-plain">
                  <ToolbarItem>
                    <Dropdown
                      isOpen={isUserDropdownOpen}
                      onSelect={() => setIsUserDropdownOpen(false)}
                      onOpenChange={setIsUserDropdownOpen}
                      popperProps={{ position: "right" }}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsUserDropdownOpen(!isUserDropdownOpen)
                          }
                          isExpanded={isUserDropdownOpen}
                          variant="plainText"
                          icon={<UserIcon />}
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
                </ToolbarGroup>
              )}
              {rightBrand ? (
                <ToolbarGroup>
                  <ToolbarItem>
                    <Brand
                      src={rightBrand.src}
                      alt={rightBrand.alt}
                      heights={{ default: rightBrand.height }}
                    />
                  </ToolbarItem>
                </ToolbarGroup>
              ) : null}
            </ToolbarContent>
          </Toolbar>
        </MastheadContent>
      </Masthead>
    </>
  );
};
