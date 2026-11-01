import dayjs from "dayjs";

/** How often the dashboard's cards refetch. */
export const DASHBOARD_REFRESH_INTERVAL = 30_000;

/** Days shown by the tasks trend. */
export const TREND_DAYS = 7;

/** One local calendar day, as the `finished_at` range the Tasks API filters on. */
export interface IDayWindow {
  label: string;
  gte: string;
  lt: string;
}

/** The last `count` local days, oldest first, today last. */
export const lastDays = (count: number): IDayWindow[] => {
  const today = dayjs().startOf("day");
  return Array.from({ length: count }, (_, index) => {
    const day = today.subtract(count - 1 - index, "day");
    return {
      label: day.format("ddd D"),
      gte: day.toISOString(),
      lt: day.add(1, "day").toISOString(),
    };
  });
};

/** 24 hours before now, for "in the last 24 hours" counts. */
export const hoursAgo = (hours: number): string =>
  dayjs().subtract(hours, "hour").toISOString();
