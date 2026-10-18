import type { Page } from "@playwright/test";

/**
 * The per-row task poll: `GET …/tasks/?reserved_resources=<prn>&state__in=…`.
 * The `reserved_resources=` filter param is unique to the PRN-joined row queries
 * (`useTasksByPrnQueries`, the `limit: 1` count probe, and the expanded
 * `useTasksByPrnListQuery` sub-table), so this matches those and nothing else.
 * Both read the same fake `running` tasks — the probe only needs `count` plus the
 * first result; the sub-table lists them all.
 */
const TASKS_BY_PRN_POLL = /\/api\/v3\/tasks\/\?.*reserved_resources=/;

type MockTaskKind = "delete" | "update";

// Pulp names its async generic operations `…ageneral_delete` / `…ageneral_update`;
// the UI derives the row status ("Deleting…"/"Updating…") from these names.
const TASK_NAME: Record<MockTaskKind, string> = {
  delete: "pulpcore.app.tasks.base.ageneral_delete",
  update: "pulpcore.app.tasks.base.ageneral_update",
};

/**
 * Intercept the row-status task poll and report `count` in-flight (`running`) tasks
 * reserving `prn`, so the otherwise sub-second in-progress window is deterministically
 * observable — including across a page reload, which is the whole point of the
 * server-derived design (no client state to lose). The resource itself is real
 * (created via REST); only the task poll is faked, so this exercises the real list
 * render + the real PRN join + reload remount.
 *
 * `count` drives the Status cell's three branches: 1 → the labelled spinner, 2+ →
 * the compound-expand count toggle whose sub-table lists every returned task.
 */
export async function mockInFlightTask(
  page: Page,
  prn: string,
  kind: MockTaskKind,
  count = 1,
): Promise<void> {
  const results = Array.from({ length: count }, (_, index) => ({
    // Distinct, stable, valid-UUIDv7-shaped hrefs so each sub-table row has its own id.
    pulp_href: `/api/pulp/default/api/v3/tasks/00000000-0000-7000-8000-0000000e2e${(
      index + 1
    )
      .toString()
      .padStart(2, "0")}/`,
    state: "running",
    name: TASK_NAME[kind],
    // Staggered so the sub-table's "-pulp_created" ordering is deterministic.
    pulp_created: new Date(Date.now() - index * 1000).toISOString(),
    reserved_resources_record: [prn],
  }));
  await page.route(TASKS_BY_PRN_POLL, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ count, next: null, previous: null, results }),
    }),
  );
}
