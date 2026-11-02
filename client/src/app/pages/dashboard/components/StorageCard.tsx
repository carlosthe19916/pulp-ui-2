import type React from "react";

import prettyBytes from "pretty-bytes";

import { ChartDonutUtilization } from "@patternfly/react-charts/victory";
import {
  Bullseye,
  Content,
  ContentVariants,
  Skeleton,
} from "@patternfly/react-core";

import { useApiStatus } from "@app/hooks/useApiStatus";

import { DashboardCard } from "./DashboardCard";

/** Used out of total storage, when the server reports it (filesystem storage). */
export const StorageCard: React.FC = () => {
  const { status, isLoading } = useApiStatus();
  const { total, used, free } = status?.storage ?? {};

  if (isLoading) {
    return (
      <DashboardCard title="Storage">
        <Skeleton screenreaderText="Loading storage" height="10rem" />
      </DashboardCard>
    );
  }
  if (!total || used == null) {
    return (
      <DashboardCard title="Storage">
        <Content component={ContentVariants.p}>
          This Pulp&apos;s storage backend doesn&apos;t report its usage.
        </Content>
      </DashboardCard>
    );
  }

  const percent = Math.round((used / total) * 100);
  return (
    <DashboardCard title="Storage">
      <Bullseye>
        <ChartDonutUtilization
          ariaTitle="Storage used"
          ariaDesc={`${prettyBytes(used)} of ${prettyBytes(total)} used`}
          constrainToVisibleArea
          data={{ x: "Used", y: percent }}
          labels={({ datum }: { datum: { x?: string; y: number } }) =>
            datum.x ? `${datum.x}: ${datum.y}%` : null
          }
          legendData={[
            { name: `Used: ${prettyBytes(used)}` },
            { name: `Free: ${free != null ? prettyBytes(free) : "—"}` },
          ]}
          legendOrientation="vertical"
          legendPosition="right"
          padding={{ bottom: 20, left: 20, right: 180, top: 20 }}
          subTitle={`of ${prettyBytes(total)}`}
          title={`${percent}%`}
          thresholds={[{ value: 75 }, { value: 90 }]}
          width={360}
          height={180}
        />
      </Bullseye>
    </DashboardCard>
  );
};
