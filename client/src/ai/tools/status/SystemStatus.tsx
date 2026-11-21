import type React from "react";

import prettyBytes from "pretty-bytes";

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  HelperText,
  HelperTextItem,
  type HelperTextItemProps,
  Skeleton,
} from "@patternfly/react-core";

import { useStatusQuery } from "@app/queries/status";
import { useIsSuperuserQuery } from "@app/queries/users";
import { useWorkersListQuery } from "@app/queries/workers";

import { ToolReadError } from "../../components/ToolReadError";
import { MISSING_WORKERS_PARAMS, versionMismatches } from "./systemStatus";

interface IFact {
  term: string;
  variant: HelperTextItemProps["variant"];
  text: string;
}

const online = (term: string, count: number): IFact => ({
  term,
  variant: count > 0 ? "success" : "error",
  text: count > 0 ? `${count} online` : "None online",
});

/** The Pulp instance's health from status/, plus missing workers for superusers. */
export const SystemStatus: React.FC = () => {
  const { data: status, error } = useStatusQuery();
  const { data: isSuperuser = false } = useIsSuperuserQuery();
  const { data: missing } = useWorkersListQuery({
    params: MISSING_WORKERS_PARAMS,
    options: { enabled: isSuperuser },
  });

  if (error) {
    return (
      <ToolReadError
        error={error}
        action="read the Pulp status"
        subject="the Pulp status"
      />
    );
  }
  if (!status) {
    return <Skeleton screenreaderText="Loading the Pulp status" />;
  }

  const missingCount = missing?.count ?? 0;
  const mismatches = versionMismatches(status);
  const { storage } = status;
  const facts: IFact[] = [
    {
      term: "Database",
      variant: status.database_connection.connected ? "success" : "error",
      text: status.database_connection.connected ? "Connected" : "Unreachable",
    },
    {
      term: "Cache (Redis)",
      // Pulp reports Redis even when caching is off, so "not connected" isn't an error.
      variant: status.redis_connection?.connected ? "success" : "default",
      text: status.redis_connection?.connected
        ? "Connected"
        : "Not connected (used only when caching is enabled)",
    },
    online("API servers", status.online_api_apps.length),
    online("Content servers", status.online_content_apps.length),
    online("Workers", status.online_workers.length),
    ...(isSuperuser && missingCount > 0
      ? [
          {
            term: "Missing workers",
            variant: "warning" as const,
            text: `${missingCount} stopped sending heartbeats`,
          },
        ]
      : []),
    ...(storage?.total && storage.used != null
      ? [
          {
            term: "Storage",
            variant: "default" as const,
            text: `${prettyBytes(storage.used)} of ${prettyBytes(storage.total)} used`,
          },
        ]
      : []),
    ...mismatches.map((mismatch) => ({
      term: `Version mismatch on ${mismatch.app}`,
      variant: "warning" as const,
      text: `${mismatch.component} ${mismatch.actual ?? "missing"}, the API has ${mismatch.expected}`,
    })),
  ];

  return (
    <Card isCompact>
      <CardHeader>
        <CardTitle component="h3">Pulp status</CardTitle>
      </CardHeader>
      <CardBody>
        <DescriptionList isCompact isHorizontal>
          {facts.map((fact) => (
            <DescriptionListGroup key={fact.term}>
              <DescriptionListTerm>{fact.term}</DescriptionListTerm>
              <DescriptionListDescription>
                <HelperText>
                  <HelperTextItem variant={fact.variant}>
                    {fact.text}
                  </HelperTextItem>
                </HelperText>
              </DescriptionListDescription>
            </DescriptionListGroup>
          ))}
          <DescriptionListGroup>
            <DescriptionListTerm>Versions</DescriptionListTerm>
            <DescriptionListDescription>
              {status.versions
                .map((version) => `${version.component} ${version.version}`)
                .join(", ")}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};
