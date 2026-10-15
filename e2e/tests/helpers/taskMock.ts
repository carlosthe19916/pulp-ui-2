import type { Page } from "@playwright/test";

/**
 * The row-status poll: `GET …/tasks/?state__in=…&fields=…reserved_resources_record…`.
 * Only `useTasksByPrnQueries` requests the `reserved_resources_record` field, so
 * this matches that query and nothing else.
 */
const TASKS_BY_PRN_POLL = /\/api\/v3\/tasks\/\?.*reserved_resources_record/;

type MockTaskKind = "delete" | "update";

// Pulp names its async generic operations `…ageneral_delete` / `…ageneral_update`;
// the UI derives the row status ("Deleting…"/"Updating…") from these names.
const TASK_NAME: Record<MockTaskKind, string> = {
  delete: "pulpcore.app.tasks.base.ageneral_delete",
  update: "pulpcore.app.tasks.base.ageneral_update",
};

/**
 * Intercept the row-status task poll and report a single in-flight (`running`)
 * task reserving `prn`, so the otherwise sub-second in-progress window is
 * deterministically observable — including across a page reload, which is the
 * whole point of the server-derived design (no client state to lose).
 *
 * The resource itself is real (created via REST); only the task poll is faked, so
 * this exercises the real list render + the real PRN join + reload remount.
 */
export async function mockInFlightTask(
  page: Page,
  prn: string,
  kind: MockTaskKind,
): Promise<void> {
  await page.route(TASKS_BY_PRN_POLL, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            pulp_href:
              "/api/pulp/default/api/v3/tasks/00000000-0000-7000-8000-00000000e2e1/",
            state: "running",
            name: TASK_NAME[kind],
            reserved_resources_record: [prn],
          },
        ],
      }),
    }),
  );
}
