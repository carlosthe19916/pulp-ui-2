import type React from "react";
import { Link, useRouterState } from "@tanstack/react-router";

import {
  Nav,
  NavGroup,
  NavItem,
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
            <NavItem isActive={isActive("/")}>
              <Link to="/">Dashboard</Link>
            </NavItem>
            <NavItem isActive={isActive("/tasks")}>
              <Link to="/tasks">Tasks</Link>
            </NavItem>
          </NavGroup>

          <NavGroup title="Content Management">
            <NavItem isActive={isActive("/content-management/repositories")}>
              <Link to="/content-management/repositories">Repositories</Link>
            </NavItem>
            <NavItem isActive={isActive("/content-management/remotes")}>
              <Link to="/content-management/remotes">Remotes</Link>
            </NavItem>
            <NavItem isActive={isActive("/content-management/distributions")}>
              <Link to="/content-management/distributions">Distributions</Link>
            </NavItem>
            <NavItem isActive={isActive("/content-management/publications")}>
              <Link to="/content-management/publications">Publications</Link>
            </NavItem>
            <NavItem isActive={isActive("/content-management/content")}>
              <Link to="/content-management/content">Content</Link>
            </NavItem>
          </NavGroup>

          <NavGroup title="Browse">
            <NavItem isActive={isActive("/browse")}>
              <Link to="/browse">Content Browser</Link>
            </NavItem>
          </NavGroup>

          <NavGroup title="Administration">
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
          </NavGroup>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
};
