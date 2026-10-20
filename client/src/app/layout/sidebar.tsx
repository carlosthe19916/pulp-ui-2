import type React from "react";
import { Link, useMatchRoute } from "@tanstack/react-router";

import {
  Nav,
  NavGroup,
  NavItem,
  PageSidebar,
  PageSidebarBody,
} from "@patternfly/react-core";

import { useDefaultDomain } from "@app/hooks/useDefaultDomain";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

export const SidebarApp: React.FC = () => {
  // `matchRoute` matches against the route tree (param segments included) with
  // proper segment-boundary matching — no manual pathname string/regex work.
  const matchRoute = useMatchRoute();
  const { enabled: domainsEnabled } = useDefaultDomain();
  // Content routes are scoped by the `$pulpDomain` path param; carry the current
  // (or default) domain into the nav links.
  const { name: pulpDomain } = useSelectedDomain();

  return (
    <PageSidebar>
      <PageSidebarBody>
        <Nav id="nav-sidebar" aria-label="Nav">
          <NavGroup title="Main">
            <NavItem isActive={!!matchRoute({ to: "/" })}>
              <Link to="/">Dashboard</Link>
            </NavItem>
          </NavGroup>

          {domainsEnabled && (
            <NavGroup title="System Management">
              <NavItem
                isActive={
                  !!matchRoute({
                    to: "/system-management/domains",
                    fuzzy: true,
                  })
                }
              >
                <Link to="/system-management/domains">Domains</Link>
              </NavItem>
            </NavGroup>
          )}

          <NavGroup title="Monitoring">
            <NavItem
              isActive={
                !!matchRoute({
                  to: "/monitoring/$pulpDomain/tasks",
                  params: { pulpDomain },
                  fuzzy: true,
                })
              }
            >
              <Link to="/monitoring/$pulpDomain/tasks" params={{ pulpDomain }}>
                Tasks
              </Link>
            </NavItem>
          </NavGroup>

          {/* Ordered to follow the Pulp content pipeline: a Remote feeds a
              Repository, which is snapshotted as a Publication and served by a
              Distribution; Content lists the individual units. */}
          <NavGroup title="Content Management">
            <NavItem
              isActive={
                !!matchRoute({
                  to: "/content-management/$pulpDomain/remotes",
                  params: { pulpDomain },
                  fuzzy: true,
                })
              }
            >
              <Link
                to="/content-management/$pulpDomain/remotes"
                params={{ pulpDomain }}
              >
                Remotes
              </Link>
            </NavItem>
            <NavItem
              isActive={
                !!matchRoute({
                  to: "/content-management/$pulpDomain/repositories",
                  params: { pulpDomain },
                  fuzzy: true,
                })
              }
            >
              <Link
                to="/content-management/$pulpDomain/repositories"
                params={{ pulpDomain }}
              >
                Repositories
              </Link>
            </NavItem>
            <NavItem
              isActive={
                !!matchRoute({
                  to: "/content-management/$pulpDomain/publications",
                  params: { pulpDomain },
                  fuzzy: true,
                })
              }
            >
              <Link
                to="/content-management/$pulpDomain/publications"
                params={{ pulpDomain }}
              >
                Publications
              </Link>
            </NavItem>
            <NavItem
              isActive={
                !!matchRoute({
                  to: "/content-management/$pulpDomain/distributions",
                  params: { pulpDomain },
                  fuzzy: true,
                })
              }
            >
              <Link
                to="/content-management/$pulpDomain/distributions"
                params={{ pulpDomain }}
              >
                Distributions
              </Link>
            </NavItem>
          </NavGroup>

          <NavGroup title="Administration">
            <NavItem
              isActive={!!matchRoute({ to: "/admin/users", fuzzy: true })}
            >
              <Link to="/admin/users">Users</Link>
            </NavItem>
            <NavItem
              isActive={!!matchRoute({ to: "/admin/groups", fuzzy: true })}
            >
              <Link to="/admin/groups">Groups</Link>
            </NavItem>
            <NavItem
              isActive={!!matchRoute({ to: "/admin/roles", fuzzy: true })}
            >
              <Link to="/admin/roles">Roles</Link>
            </NavItem>
            <NavItem
              isActive={
                !!matchRoute({ to: "/admin/signing-services", fuzzy: true })
              }
            >
              <Link to="/admin/signing-services">Signing Services</Link>
            </NavItem>
          </NavGroup>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
};
