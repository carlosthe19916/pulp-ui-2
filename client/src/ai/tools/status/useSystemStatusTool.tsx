import { useFrontendTool } from "@copilotkit/react-core/v2";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { useDefaultDomain } from "@app/hooks/useDefaultDomain";
import { statusQueryOptions } from "@app/queries/status";
import { isSuperuserQueryOptions } from "@app/queries/users";
import { workersListQueryOptions } from "@app/queries/workers";

import { SystemStatus } from "./SystemStatus";
import { MISSING_WORKERS_PARAMS, versionMismatches } from "./systemStatus";

const parameters = z.object({});

/** Lets the assistant show the health of the Pulp instance. */
export const useSystemStatusTool = () => {
  const queryClient = useQueryClient();
  const domain = useDefaultDomain();

  useFrontendTool(
    {
      name: "showSystemStatus",
      description:
        "Show the health of the Pulp instance: database, Redis, online and missing workers, API and content servers, storage, component versions and version mismatches between servers. Use it for stuck tasks and when Pulp seems down.",
      parameters,
      handler: async () => {
        // The app keeps status/ cached for minutes; a health question needs it now.
        const status = await queryClient.query({
          ...statusQueryOptions,
          staleTime: 0,
        });
        const isSuperuser = await queryClient.query(
          isSuperuserQueryOptions({ domain }),
        );
        const missingWorkers = isSuperuser
          ? (
              await queryClient.query(
                workersListQueryOptions({
                  domain,
                  params: MISSING_WORKERS_PARAMS,
                }),
              )
            ).count
          : "only superusers can see missing workers";
        return {
          databaseConnected: status.database_connection.connected,
          redisConnected: status.redis_connection?.connected ?? false,
          onlineWorkers: status.online_workers.length,
          onlineApiServers: status.online_api_apps.length,
          onlineContentServers: status.online_content_apps.length,
          missingWorkers,
          storage: status.storage,
          versions: status.versions.map(
            (version) => `${version.component} ${version.version}`,
          ),
          versionMismatches: versionMismatches(status),
        };
      },
      render: () => <SystemStatus />,
    },
    [queryClient, domain],
  );
};
