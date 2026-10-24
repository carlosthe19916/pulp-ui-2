import type React from "react";

import { Link, useMatchRoute } from "@tanstack/react-router";

import {
  Nav,
  NavGroup,
  NavItem,
  PageSidebar,
  PageSidebarBody,
} from "@patternfly/react-core";

import { useApiStatus } from "@app/hooks/useApiStatus";
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { getPlugin } from "@catalog";

export const SidebarApp: React.FC = () => {
  // `matchRoute` matches against the route tree (param segments included) with
  // proper segment-boundary matching — no manual pathname string/regex work.
  const matchRoute = useMatchRoute();
  const { enabled: domainsEnabled } = useDefaultDomain();
  // Content routes are scoped by the `$pulpDomain` path param; carry the current
  // (or default) domain into the nav links.
  const { name: pulpDomain } = useSelectedDomain();
  // Plugin-specific pages show only when the plugin is installed.
  const { status } = useApiStatus();
  const isInstalled = (pulpType: string) =>
    !!getPlugin(pulpType)?.isAvailable(status?.versions ?? []);
  const hasAcs = ["file.file", "rpm.rpm", "deb.deb"].some(isInstalled);

  return (
    <PageSidebar>
      <PageSidebarBody>
        <Nav id="nav-sidebar" aria-label="Nav">
          <NavGroup title="Main">
            <NavItem isActive={!!matchRoute({ to: "/" })}>
              <Link to="/">Dashboard</Link>
            </NavItem>
          </NavGroup>

          <NavGroup title="System Management">
            {domainsEnabled && (
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
            )}
            <NavItem
              isActive={
                !!matchRoute({
                  to: "/system-management/signing-services",
                  fuzzy: true,
                })
              }
            >
              <Link to="/system-management/signing-services">
                Signing Services
              </Link>
            </NavItem>
            <NavItem
              isActive={
                !!matchRoute({
                  to: "/system-management/$pulpDomain/content-guards",
                  params: { pulpDomain },
                  fuzzy: true,
                })
              }
            >
              <Link
                to="/system-management/$pulpDomain/content-guards"
                params={{ pulpDomain }}
              >
                Content Guards
              </Link>
            </NavItem>
            {hasAcs && (
              <NavItem
                isActive={
                  !!matchRoute({
                    to: "/system-management/$pulpDomain/alternate-content-sources",
                    params: { pulpDomain },
                    fuzzy: true,
                  })
                }
              >
                <Link
                  to="/system-management/$pulpDomain/alternate-content-sources"
                  params={{ pulpDomain }}
                >
                  Alternate Content Sources
                </Link>
              </NavItem>
            )}
            <NavItem
              isActive={
                !!matchRoute({
                  to: "/system-management/$pulpDomain/export-import",
                  params: { pulpDomain },
                  fuzzy: true,
                })
              }
            >
              <Link
                to="/system-management/$pulpDomain/export-import"
                params={{ pulpDomain }}
              >
                Export &amp; Import
              </Link>
            </NavItem>
            <NavItem
              isActive={
                !!matchRoute({
                  to: "/system-management/$pulpDomain/upstream-pulps",
                  params: { pulpDomain },
                  fuzzy: true,
                })
              }
            >
              <Link
                to="/system-management/$pulpDomain/upstream-pulps"
                params={{ pulpDomain }}
              >
                Upstream Pulps
              </Link>
            </NavItem>
            <NavItem
              isActive={
                !!matchRoute({
                  to: "/system-management/$pulpDomain/storage",
                  params: { pulpDomain },
                  fuzzy: true,
                })
              }
            >
              <Link
                to="/system-management/$pulpDomain/storage"
                params={{ pulpDomain }}
              >
                Storage
              </Link>
            </NavItem>
            <NavItem
              isActive={
                !!matchRoute({
                  to: "/system-management/$pulpDomain/maintenance",
                  params: { pulpDomain },
                  fuzzy: true,
                })
              }
            >
              <Link
                to="/system-management/$pulpDomain/maintenance"
                params={{ pulpDomain }}
              >
                Maintenance
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
            <NavItem
              isActive={
                !!matchRoute({
                  to: "/content-management/$pulpDomain/content",
                  params: { pulpDomain },
                  fuzzy: true,
                })
              }
            >
              <Link
                to="/content-management/$pulpDomain/content"
                params={{ pulpDomain }}
              >
                Content
              </Link>
            </NavItem>
            {isInstalled("ansible.ansible") && (
              <NavItem
                isActive={
                  !!matchRoute({
                    to: "/content-management/$pulpDomain/ansible-collections",
                    params: { pulpDomain },
                    fuzzy: true,
                  })
                }
              >
                <Link
                  to="/content-management/$pulpDomain/ansible-collections"
                  params={{ pulpDomain }}
                >
                  Ansible Collections
                </Link>
              </NavItem>
            )}
            {isInstalled("container.container") && (
              <NavItem
                isActive={
                  !!matchRoute({
                    to: "/content-management/$pulpDomain/container-namespaces",
                    params: { pulpDomain },
                    fuzzy: true,
                  })
                }
              >
                <Link
                  to="/content-management/$pulpDomain/container-namespaces"
                  params={{ pulpDomain }}
                >
                  Container Namespaces
                </Link>
              </NavItem>
            )}
          </NavGroup>

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
            <NavItem
              isActive={
                !!matchRoute({
                  to: "/monitoring/$pulpDomain/task-schedules",
                  params: { pulpDomain },
                  fuzzy: true,
                })
              }
            >
              <Link
                to="/monitoring/$pulpDomain/task-schedules"
                params={{ pulpDomain }}
              >
                Task Schedules
              </Link>
            </NavItem>
            {(isInstalled("rpm.rpm") || isInstalled("python.python")) && (
              <NavItem
                isActive={
                  !!matchRoute({
                    to: "/monitoring/$pulpDomain/vulnerability-reports",
                    params: { pulpDomain },
                    fuzzy: true,
                  })
                }
              >
                <Link
                  to="/monitoring/$pulpDomain/vulnerability-reports"
                  params={{ pulpDomain }}
                >
                  Vulnerability Reports
                </Link>
              </NavItem>
            )}
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
                !!matchRoute({ to: "/admin/access-policies", fuzzy: true })
              }
            >
              <Link to="/admin/access-policies">Access Policies</Link>
            </NavItem>
          </NavGroup>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
};
