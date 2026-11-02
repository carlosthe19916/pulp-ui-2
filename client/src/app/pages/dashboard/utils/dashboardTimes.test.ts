import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import { lastDays } from "./dashboardTimes";

describe("lastDays", () => {
  it("returns consecutive local days ending today", () => {
    const days = lastDays(7);
    expect(days).toHaveLength(7);
    expect(days[6]?.gte).toBe(dayjs().startOf("day").toISOString());
    days.slice(1).forEach((day, index) => {
      expect(day.gte).toBe(days[index]?.lt);
    });
  });
});
