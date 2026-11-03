import type React from "react";
import { useState } from "react";

import { Link, useLocation, useMatchRoute } from "@tanstack/react-router";

import { Nav, NavExpandable, NavItem, NavList } from "@patternfly/react-core";

import { useApiStatus } from "@app/hooks/useApiStatus";
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { getScannableRepositoryTypes } from "@catalog";
import { getAcsTypes, getPluginPages } from "@plugins";

interface INavAppProps {
  onSelect: () => void;
}

export const NavApp: React.FC<INavAppProps> = ({ onSelect }) => {
  // `matchRoute` matches against the route tree (param segments included) with
  // proper segment-boundary matching — no manual pathname string/regex work.
  const matchRoute = useMatchRoute();
  const { enabled: domainsEnabled } = useDefaultDomain();
  // Content routes are scoped by the `$pulpDomain` path param; carry the current
  // (or default) domain into the nav links.
  const { name: pulpDomain } = useSelectedDomain();
  // Plugin-specific pages show only when the plugin is installed.
  const { plugins: installed } = useApiStatus();
  const pluginPages = getPluginPages({ installed });
  const hasAcs = getAcsTypes({ installed }).length > 0;
  const canScan = getScannableRepositoryTypes({ installed }).length > 0;

  // Each group owns one top-level URL segment.
  const section = useLocation({
    select: (location) => location.pathname.split("/")[1],
  });
  // The current page's group opens on load and whenever navigation enters another group.
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => ({ [section]: true }),
  );
  const [openedSection, setOpenedSection] = useState(section);
  if (openedSection !== section) {
    setOpenedSection(section);
    setExpandedGroups((prev) => ({ ...prev, [section]: true }));
  }
  const groupProps = (segment: string) => ({
    isActive: section === segment,
    isExpanded: !!expandedGroups[segment],
    onExpand: (_event: React.MouseEvent, isExpanded: boolean) =>
      setExpandedGroups((prev) => ({ ...prev, [segment]: isExpanded })),
  });

  return (
    <Nav id="nav-sidebar" aria-label="Nav" onSelect={onSelect}>
      <NavList>
        <NavExpandable title="Main" {...groupProps("dashboard")}>
          <NavItem
            isActive={
              !!matchRoute({
                to: "/dashboard/$pulpDomain",
                params: { pulpDomain },
                fuzzy: true,
              })
            }
          >
            <Link to="/dashboard/$pulpDomain" params={{ pulpDomain }}>
              Dashboard
            </Link>
          </NavItem>
        </NavExpandable>

        <NavExpandable
          title="System Management"
          {...groupProps("system-management")}
        >
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
        </NavExpandable>

        {/* Ordered to follow the Pulp content pipeline: a Remote feeds a
              Repository, which is snapshotted as a Publication and served by a
              Distribution; Content lists the individual units. */}
        <NavExpandable
          title="Content Management"
          {...groupProps("content-management")}
        >
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
          {pluginPages.map(({ page }) => (
            <NavItem
              key={page.to}
              isActive={
                !!matchRoute({
                  to: page.to,
                  params: { pulpDomain },
                  fuzzy: true,
                })
              }
            >
              <Link to={page.to} params={{ pulpDomain }}>
                {page.label}
              </Link>
            </NavItem>
          ))}
        </NavExpandable>

        <NavExpandable title="Monitoring" {...groupProps("monitoring")}>
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
          <NavItem
            isActive={!!matchRoute({ to: "/monitoring/workers", fuzzy: true })}
          >
            <Link to="/monitoring/workers">Workers</Link>
          </NavItem>
          {canScan && (
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
        </NavExpandable>

        <NavExpandable title="Administration" {...groupProps("admin")}>
          <NavItem isActive={!!matchRoute({ to: "/admin/users", fuzzy: true })}>
            <Link to="/admin/users">Users</Link>
          </NavItem>
          <NavItem
            isActive={!!matchRoute({ to: "/admin/groups", fuzzy: true })}
          >
            <Link to="/admin/groups">Groups</Link>
          </NavItem>
          <NavItem isActive={!!matchRoute({ to: "/admin/roles", fuzzy: true })}>
            <Link to="/admin/roles">Roles</Link>
          </NavItem>
          <NavItem
            isActive={
              !!matchRoute({ to: "/admin/access-policies", fuzzy: true })
            }
          >
            <Link to="/admin/access-policies">Access policies</Link>
          </NavItem>
        </NavExpandable>
      </NavList>
    </Nav>
  );
};
