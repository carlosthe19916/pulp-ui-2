import type { PaginatedTaskResponseList, TaskResponse } from "@app/client";

const now = new Date();
const ago = (minutes: number) =>
  new Date(now.getTime() - minutes * 60 * 1000).toISOString();

export const tasksMock: PaginatedTaskResponseList = {
  count: 5,
  next: null,
  previous: null,
  results: [
    {
      pulp_href:
        "/api/pulp/default/api/v3/tasks/00000000-0000-0000-0000-000000000001/",
      pulp_created: ago(120),
      state: "completed",
      name: "pulp_file.app.tasks.synchronizing.synchronize",
      logging_cid: "abc123",
      created_by: "/api/pulp/default/api/v3/users/1/",
      started_at: ago(119),
      finished_at: ago(117),
      progress_reports: [
        {
          message: "Downloading artifacts",
          code: "sync.downloading",
          state: "completed",
          done: 42,
          total: 42,
        },
      ],
      created_resources: [
        "/api/pulp/default/api/v3/repositories/file/file/repo1/versions/2/",
      ],
      child_tasks: [],
    },
    {
      pulp_href:
        "/api/pulp/default/api/v3/tasks/00000000-0000-0000-0000-000000000002/",
      pulp_created: ago(60),
      state: "running",
      name: "pulp_file.app.tasks.synchronizing.synchronize",
      logging_cid: "def456",
      created_by: "/api/pulp/default/api/v3/users/1/",
      started_at: ago(59),
      progress_reports: [
        {
          message: "Downloading artifacts",
          code: "sync.downloading",
          state: "running",
          done: 15,
          total: 100,
        },
      ],
      created_resources: [],
      child_tasks: [],
    },
    {
      pulp_href:
        "/api/pulp/default/api/v3/tasks/00000000-0000-0000-0000-000000000003/",
      pulp_created: ago(30),
      state: "failed",
      name: "pulpcore.app.tasks.orphan.orphan_cleanup",
      logging_cid: "ghi789",
      created_by: "/api/pulp/default/api/v3/users/1/",
      started_at: ago(29),
      finished_at: ago(28),
      progress_reports: [],
      created_resources: [],
      child_tasks: [],
    },
    {
      pulp_href:
        "/api/pulp/default/api/v3/tasks/00000000-0000-0000-0000-000000000004/",
      pulp_created: ago(10),
      state: "waiting",
      name: "pulp_file.app.tasks.publishing.publish",
      logging_cid: "jkl012",
      created_by: "/api/pulp/default/api/v3/users/1/",
      progress_reports: [],
      created_resources: [],
      child_tasks: [],
    },
    {
      pulp_href:
        "/api/pulp/default/api/v3/tasks/00000000-0000-0000-0000-000000000005/",
      pulp_created: ago(180),
      state: "canceled",
      name: "pulp_file.app.tasks.synchronizing.synchronize",
      logging_cid: "mno345",
      created_by: "/api/pulp/default/api/v3/users/1/",
      started_at: ago(179),
      finished_at: ago(175),
      progress_reports: [],
      created_resources: [],
      child_tasks: [],
    },
  ],
};

export const taskDetailMock: TaskResponse = tasksMock.results![0]!;
