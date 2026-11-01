import type React from "react";
import { useRef, useState } from "react";

import { Link, useLocation, useMatchRoute } from "@tanstack/react-router";

import {
  Nav,
  NavExpandable,
  NavItem,
  NavList,
  Tooltip,
} from "@patternfly/react-core";
import RhUiCubesIcon from "@patternfly/react-icons/dist/esm/icons/rh-ui-cubes-icon";
import RhUiHomeIcon from "@patternfly/react-icons/dist/esm/icons/rh-ui-home-icon";
import RhUiMonitoringIcon from "@patternfly/react-icons/dist/esm/icons/rh-ui-monitoring-icon";
import RhUiServerStackIcon from "@patternfly/react-icons/dist/esm/icons/rh-ui-server-stack-icon";
import RhUiUsersIcon from "@patternfly/react-icons/dist/esm/icons/rh-ui-users-icon";

import { useApiStatus } from "@app/hooks/useApiStatus";
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { getScannableRepositoryTypes } from "@catalog";
import { getAcsTypes, getPluginPages } from "@plugins";

interface INavGroupProps {
  title: string;
  icon: React.ReactNode;
  isActive: boolean;
  isExpanded: boolean;
  isDockExpanded: boolean;
  onExpand: (isExpanded: boolean) => void;
  children: React.ReactNode;
}

/** A nav group that shows only its icon, with a tooltip, while the dock is collapsed. */
const NavGroup: React.FC<INavGroupProps> = ({
  title,
  icon,
  isActive,
  isExpanded,
  isDockExpanded,
  onExpand,
  children,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <NavExpandable
        title={title}
        icon={icon}
        isActive={isActive}
        isExpanded={isExpanded}
        hasExpandableIcon
        buttonProps={{ ref: buttonRef, "aria-label": title }}
        onExpand={(_event, value) => onExpand(value)}
      >
        {children}
      </NavExpandable>
      {!isDockExpanded && (
        <Tooltip
          aria="none"
          aria-live="off"
          triggerRef={buttonRef}
          content={title}
        />
      )}
    </>
  );
};

interface INavAppProps {
  isDockExpanded: boolean;
  /** Opens the collapsed dock as an overlay, so a clicked group can show its pages. */
  onOpenDock: () => void;
  onSelect: () => void;
}

export const NavApp: React.FC<INavAppProps> = ({
  isDockExpanded,
  onOpenDock,
  onSelect,
}) => {
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

  // Each group owns one top-level URL segment ("" for the dashboard).
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
    isDockExpanded,
    onExpand: (isExpanded: boolean) => {
      // A collapsed dock can't show a group's pages: open it with this group.
      if (!isDockExpanded) {
        onOpenDock();
      }
      setExpandedGroups((prev) => ({
        ...prev,
        [segment]: isDockExpanded ? isExpanded : true,
      }));
    },
  });

  return (
    <Nav id="nav-sidebar" aria-label="Nav" variant="docked" onSelect={onSelect}>
      <NavList>
        <NavGroup title="Main" icon={<RhUiHomeIcon />} {...groupProps("")}>
          <NavItem isActive={!!matchRoute({ to: "/" })}>
            <Link to="/">Dashboard</Link>
          </NavItem>
        </NavGroup>

        <NavGroup
          title="System Management"
          icon={<RhUiServerStackIcon />}
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
        </NavGroup>

        {/* Ordered to follow the Pulp content pipeline: a Remote feeds a
              Repository, which is snapshotted as a Publication and served by a
              Distribution; Content lists the individual units. */}
        <NavGroup
          title="Content Management"
          icon={<RhUiCubesIcon />}
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
        </NavGroup>

        <NavGroup
          title="Monitoring"
          icon={<RhUiMonitoringIcon />}
          {...groupProps("monitoring")}
        >
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
        </NavGroup>

        <NavGroup
          title="Administration"
          icon={<RhUiUsersIcon />}
          {...groupProps("admin")}
        >
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
        </NavGroup>
      </NavList>
    </Nav>
  );
};
