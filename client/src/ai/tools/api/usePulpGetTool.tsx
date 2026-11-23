import { ToolCallStatus, useFrontendTool } from "@copilotkit/react-core/v2";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { Skeleton } from "@patternfly/react-core";

import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { isHttpError } from "@app/utils/isHttpError";

import { refuseForbidden } from "../refuseForbidden";
import { ApiResult } from "./ApiResult";
import {
  boundedParams,
  pulpGetQueryOptions,
  resolveApiUrl,
} from "./pulpGetRequest";
import { trimForModel } from "./trimForModel";

const parameters = z.object({
  path: z
    .string()
    .describe(
      "An endpoint relative to api/v3/ from findEndpoints (e.g. content/rpm/packages/), or a pulp_href from an earlier result, with a {href} suffix if any (e.g. <pulp_href>versions/)",
    ),
  params: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .describe(
      "Query filters from findEndpoints, plus limit (default 20, max 100), offset, ordering (e.g. -pulp_created) and fields (comma-separated) to keep responses small",
    ),
});

/** Lets the assistant read any Pulp API endpoint as the user, like the CLI does. */
export const usePulpGetTool = () => {
  const queryClient = useQueryClient();
  const domain = useSelectedDomain();

  useFrontendTool(
    {
      name: "pulpGet",
      description:
        "Read anything from the Pulp API (GET only) as the signed-in user, and show it as a card. Use it for questions the other tools don't cover; find the endpoint and its filters with findEndpoints first. Chain reads: use pulp_hrefs from one result as filters or paths of the next.",
      parameters,
      handler: async ({ path, params }) => {
        const url = resolveApiUrl({ path, domain });
        if (!url) {
          return {
            error:
              "Not a Pulp API path. Use an endpoint from findEndpoints or a pulp_href.",
          };
        }
        return refuseForbidden({
          action: `read ${path}`,
          read: async () => {
            try {
              return trimForModel(
                await queryClient.query(
                  pulpGetQueryOptions({ url, params: boundedParams(params) }),
                ),
              );
            } catch (error) {
              if (isHttpError({ error, status: 404 })) {
                return {
                  error:
                    "Pulp has no such endpoint or object. Check it with findEndpoints.",
                };
              }
              if (isHttpError({ error, status: 400 })) {
                const details = (error as { response?: { data?: unknown } })
                  .response?.data;
                return {
                  error: "Pulp rejected the request.",
                  details: trimForModel(details),
                };
              }
              throw error;
            }
          },
        });
      },
      render: ({ args, status }) => {
        if (status === ToolCallStatus.InProgress || !args.path) {
          return <Skeleton screenreaderText="Reading Pulp" />;
        }
        const url = resolveApiUrl({ path: args.path, domain });
        return url ? (
          <ApiResult
            url={url}
            params={boundedParams(args.params)}
            path={args.path}
          />
        ) : null;
      },
    },
    [queryClient, domain],
  );
};
