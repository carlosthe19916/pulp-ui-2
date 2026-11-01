import type React from "react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartStack,
  ChartVoronoiContainer,
} from "@patternfly/react-charts/victory";
import { ExpandableSection, Skeleton, Stack } from "@patternfly/react-core";
import { t_chart_color_blue_200 as completedColor } from "@patternfly/react-tokens/dist/esm/t_chart_color_blue_200";
import { t_chart_color_red_orange_100 as failedColorDark } from "@patternfly/react-tokens/dist/esm/t_chart_color_red_orange_100";
import { t_chart_color_red_orange_200 as failedColorLight } from "@patternfly/react-tokens/dist/esm/t_chart_color_red_orange_200";

import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { useTheme } from "@app/hooks/useTheme";
import { type ITaskListParams, useTasksCountQueries } from "@app/queries/tasks";

import {
  DASHBOARD_REFRESH_INTERVAL,
  lastDays,
  TREND_DAYS,
} from "../../utils/dashboardTimes";
import { DashboardCard } from "../DashboardCard";
import { type ITrendDay, TaskTrendTable } from "./TaskTrendTable";
import { useContainerWidth } from "./useContainerWidth";

const SERIES = [
  { name: "Completed", state: "completed" },
  { name: "Failed", state: "failed" },
] as const;

const CHART_HEIGHT = 250;

/** Completed and failed tasks per day over the last week, in the domain. */
export const TaskTrendCard: React.FC = () => {
  const { name: pulpDomain } = useSelectedDomain();
  const { isDark } = useTheme();
  const { ref, width } = useContainerWidth();
  // Blue/red-orange stays apart under color-vision deficiency, unlike green/red; the
  // tokens resolve per theme, and dark needs red-orange-100 to stay in the lightness band.
  const colors = {
    completed: completedColor.var,
    failed: isDark ? failedColorDark.var : failedColorLight.var,
  };
  // Fixed at mount so the query keys don't change every render.
  const [days] = useState(() => lastDays(TREND_DAYS));
  const paramsList: Omit<ITaskListParams, "limit" | "offset">[] = days.flatMap(
    (day) =>
      SERIES.map(({ state }) => ({
        state,
        finished_at__gte: day.gte,
        finished_at__lt: day.lt,
      })),
  );
  const { counts, isLoading } = useTasksCountQueries({
    paramsList,
    refetchInterval: DASHBOARD_REFRESH_INTERVAL,
  });

  const trend: ITrendDay[] = days.map((day, index) => ({
    label: day.label,
    completed: counts[index * SERIES.length] ?? 0,
    failed: counts[index * SERIES.length + 1] ?? 0,
  }));
  const total = trend.reduce((sum, day) => sum + day.completed + day.failed, 0);
  const maxDay = Math.max(...trend.map((day) => day.completed + day.failed));

  return (
    <DashboardCard
      title={
        isLoading
          ? "Tasks finished in the last 7 days"
          : `${total} ${total === 1 ? "task" : "tasks"} finished in the last 7 days`
      }
      footer={
        <Link to="/monitoring/$pulpDomain/tasks" params={{ pulpDomain }}>
          View tasks
        </Link>
      }
    >
      {/* Always mounted, so the width is measured before the data arrives. */}
      <div ref={ref}>
        {isLoading ? (
          <Skeleton screenreaderText="Loading task trend" height="15rem" />
        ) : (
          <Stack hasGutter>
            <div>
              {width > 0 && (
                <Chart
                  ariaTitle="Tasks finished per day"
                  ariaDesc="Completed and failed tasks for each of the last 7 days"
                  containerComponent={
                    <ChartVoronoiContainer
                      labels={({
                        datum,
                      }: {
                        datum: { childName?: string; y: number };
                      }) => `${datum.childName ?? ""}: ${datum.y}`}
                      constrainToVisibleArea
                    />
                  }
                  domain={{ y: [0, Math.max(4, maxDay)] }}
                  domainPadding={{ x: [30, 30] }}
                  legendData={SERIES.map(({ name, state }) => ({
                    name,
                    symbol: { fill: colors[state] },
                  }))}
                  legendPosition="bottom"
                  height={CHART_HEIGHT}
                  width={width}
                  padding={{ bottom: 75, left: 50, right: 30, top: 20 }}
                >
                  <ChartAxis />
                  <ChartAxis
                    dependentAxis
                    showGrid
                    tickFormat={(tick: number) =>
                      Number.isInteger(tick) ? tick : ""
                    }
                  />
                  <ChartStack>
                    {SERIES.map(({ name, state }) => (
                      <ChartBar
                        key={state}
                        name={name}
                        barWidth={18}
                        style={{ data: { fill: colors[state] } }}
                        data={trend.map((day) => ({
                          x: day.label,
                          y: day[state],
                        }))}
                      />
                    ))}
                  </ChartStack>
                </Chart>
              )}
            </div>
            <ExpandableSection
              toggleTextCollapsed="Show as a table"
              toggleTextExpanded="Hide table"
            >
              <TaskTrendTable days={trend} />
            </ExpandableSection>
          </Stack>
        )}
      </div>
    </DashboardCard>
  );
};
