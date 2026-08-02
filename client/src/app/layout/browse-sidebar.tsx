import type React from "react";
import { Link, useRouterState } from "@tanstack/react-router";

import {
  Nav,
  NavGroup,
  NavItem,
  PageSidebar,
  PageSidebarBody,
} from "@patternfly/react-core";

/** Slim consumer nav for `/browse*` — no admin resource sections. */
export const BrowseSidebar: React.FC = () => {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isActive = (path: string) => {
    if (path === "/browse") {
      return currentPath === "/browse" || currentPath.startsWith("/browse/");
    }
    return currentPath.startsWith(path);
  };

  return (
    <PageSidebar>
      <PageSidebarBody>
        <Nav id="nav-browse-sidebar" aria-label="Browse navigation">
          <NavGroup title="Browse">
            <NavItem isActive={isActive("/browse")}>
              <Link to="/browse">Content Browser</Link>
            </NavItem>
          </NavGroup>
          <NavGroup title="Console">
            <NavItem isActive={currentPath === "/"}>
              <Link to="/">Admin console</Link>
            </NavItem>
          </NavGroup>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
};
