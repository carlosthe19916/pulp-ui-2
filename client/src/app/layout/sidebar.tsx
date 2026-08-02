import type React from "react";
import { Link, useRouterState } from "@tanstack/react-router";

import {
  Nav,
  NavGroup,
  NavItem,
  NavList,
  PageSidebar,
  PageSidebarBody,
} from "@patternfly/react-core";

export const SidebarApp: React.FC = () => {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  return (
    <PageSidebar>
      <PageSidebarBody>
        <Nav id="nav-sidebar" aria-label="Nav">
          <NavGroup title="Main">
            <NavList>
              <NavItem isActive={isActive("/")}>
                <Link to="/">Dashboard</Link>
              </NavItem>
              <NavItem isActive={isActive("/tasks")}>
                <Link to="/tasks">Tasks</Link>
              </NavItem>
            </NavList>
          </NavGroup>

          <NavGroup title="Content Management">
            <NavList>
              <NavItem isActive={isActive("/repositories")}>
                <Link to="/repositories">Repositories</Link>
              </NavItem>
              <NavItem isActive={isActive("/remotes")}>
                <Link to="/remotes">Remotes</Link>
              </NavItem>
              <NavItem isActive={isActive("/distributions")}>
                <Link to="/distributions">Distributions</Link>
              </NavItem>
              <NavItem isActive={isActive("/publications")}>
                <Link to="/publications">Publications</Link>
              </NavItem>
              <NavItem isActive={isActive("/content")}>
                <Link to="/content">Content</Link>
              </NavItem>
            </NavList>
          </NavGroup>

          <NavGroup title="Browse">
            <NavList>
              <NavItem isActive={isActive("/browse")}>
                <Link to="/browse">Content Browser</Link>
              </NavItem>
            </NavList>
          </NavGroup>

          <NavGroup title="Administration">
            <NavList>
              <NavItem isActive={isActive("/admin/users")}>
                <Link to="/admin/users">Users</Link>
              </NavItem>
              <NavItem isActive={isActive("/admin/groups")}>
                <Link to="/admin/groups">Groups</Link>
              </NavItem>
              <NavItem isActive={isActive("/admin/roles")}>
                <Link to="/admin/roles">Roles</Link>
              </NavItem>
              <NavItem isActive={isActive("/admin/signing-services")}>
                <Link to="/admin/signing-services">Signing Services</Link>
              </NavItem>
            </NavList>
          </NavGroup>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
};
