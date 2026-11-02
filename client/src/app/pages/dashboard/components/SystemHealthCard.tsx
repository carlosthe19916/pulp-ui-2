import type React from "react";

import { Link } from "@tanstack/react-router";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Skeleton,
  Stack,
} from "@patternfly/react-core";

import { useStatusQuery } from "@app/queries/status";
import { useIsSuperuserQuery } from "@app/queries/users";
import { useWorkersListQuery } from "@app/queries/workers";

import { DASHBOARD_REFRESH_INTERVAL } from "../utils/dashboardTimes";
import { DashboardCard } from "./DashboardCard";
import { type StatusLevel, StatusText } from "./StatusText";

interface IHealthRow {
  term: string;
  status: StatusLevel;
  text: React.ReactNode;
  extra?: React.ReactNode;
}

const onlineRow = (term: string, count: number): IHealthRow => ({
  term,
  status: count > 0 ? "success" : "danger",
  text: count > 0 ? `${count} online` : "None online",
});

/** Instance-wide health from `status/`; missing workers only for superusers. */
export const SystemHealthCard: React.FC = () => {
  const { data: status, error } = useStatusQuery({
    refetchInterval: DASHBOARD_REFRESH_INTERVAL,
  });
  const { data: isSuperuser = false } = useIsSuperuserQuery();
  // Only superusers may list workers; status/ reports online ones to everyone.
  const { data: missing } = useWorkersListQuery({
    params: { limit: 1, missing: true },
    options: { enabled: isSuperuser },
  });
  const missingCount = missing?.count ?? 0;

  const footer = isSuperuser ? (
    <Link to="/monitoring/workers">View workers</Link>
  ) : undefined;

  if (error) {
    return (
      <DashboardCard title="System health">
        <StatusText status="danger">Failed to load Pulp status.</StatusText>
      </DashboardCard>
    );
  }
  if (!status) {
    return (
      <DashboardCard title="System health">
        <Skeleton screenreaderText="Loading system health" height="8rem" />
      </DashboardCard>
    );
  }

  const workersRow = onlineRow("Workers", status.online_workers.length);
  const rows: IHealthRow[] = [
    {
      term: "Database",
      status: status.database_connection.connected ? "success" : "danger",
      text: status.database_connection.connected ? "Connected" : "Unreachable",
    },
    {
      term: "Cache (Redis)",
      // Pulp reports Redis even when caching is off, so "not connected" isn't an error.
      status: status.redis_connection?.connected ? "success" : "neutral",
      text: status.redis_connection?.connected
        ? "Connected"
        : "Not connected (used only when caching is enabled)",
    },
    onlineRow("API servers", status.online_api_apps.length),
    onlineRow("Content servers", status.online_content_apps.length),
    {
      ...workersRow,
      extra:
        isSuperuser && missingCount > 0 ? (
          <StatusText status="warning">
            <Link to="/monitoring/workers" search={{ status: "missing" }}>
              {missingCount} missing
            </Link>
          </StatusText>
        ) : undefined,
    },
  ];
  const problems = rows.filter(
    (row) => row.status === "danger" || row.extra,
  ).length;

  return (
    <DashboardCard title="System health" footer={footer}>
      <Stack hasGutter>
        {problems === 0 ? (
          <StatusText status="success">All services are running</StatusText>
        ) : (
          <StatusText status="danger">
            {problems === 1
              ? "1 service needs attention"
              : `${problems} services need attention`}
          </StatusText>
        )}
        <DescriptionList
          isCompact
          isHorizontal
          columnModifier={{ default: "1Col", xl: "2Col" }}
        >
          {rows.map((row) => (
            <DescriptionListGroup key={row.term}>
              <DescriptionListTerm>{row.term}</DescriptionListTerm>
              <DescriptionListDescription>
                <Flex spaceItems={{ default: "spaceItemsMd" }}>
                  <StatusText status={row.status}>{row.text}</StatusText>
                  {row.extra}
                </Flex>
              </DescriptionListDescription>
            </DescriptionListGroup>
          ))}
        </DescriptionList>
      </Stack>
    </DashboardCard>
  );
};
