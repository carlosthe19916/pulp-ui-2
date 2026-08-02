import type { StatusResponse } from "@app/client";

export const statusMock: StatusResponse = {
  versions: [
    {
      component: "core",
      version: "3.70.0",
      package: "pulpcore",
      module: "pulpcore",
      domain_compatible: true,
    },
    {
      component: "file",
      version: "3.6.0",
      package: "pulp-file",
      module: "pulp_file",
      domain_compatible: true,
    },
  ],
  online_workers: [
    {
      name: "resource-manager@pulp-worker-1",
      last_heartbeat: new Date().toISOString(),
    },
    {
      name: "reserved-resource-worker-1@pulp-worker-1",
      last_heartbeat: new Date().toISOString(),
    },
  ],
  online_api_apps: [
    {
      name: "pulp-api@pulp-api-1",
      last_heartbeat: new Date().toISOString(),
    },
  ],
  online_content_apps: [
    {
      name: "pulp-content@pulp-content-1",
      last_heartbeat: new Date().toISOString(),
    },
  ],
  storage: {
    total: 107374182400,
    used: 21474836480,
    free: 85899345920,
  },
};
