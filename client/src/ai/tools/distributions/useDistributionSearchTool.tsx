import { ToolCallStatus, useFrontendTool } from "@copilotkit/react-core/v2";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { Skeleton } from "@patternfly/react-core";

import type { DistributionResponse } from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  distributionDetailQueryOptions,
  distributionsListQueryOptions,
} from "@app/queries/distributions";

import { publishes } from "../publishes";
import { refuseForbidden } from "../refuseForbidden";
import {
  distributionSearchParams,
  needsDetail,
  publicationOf,
} from "./distributionSearchParams";
import { DistributionSearchResults } from "./DistributionSearchResults";

const parameters = z.object({
  basePath: z
    .string()
    .describe(
      "All or part of the distribution base path (the path after the content URL), matched case-insensitively",
    ),
});

/** Lets the assistant find distributions by base path and show what each one serves. */
export const useDistributionSearchTool = () => {
  const queryClient = useQueryClient();
  const domain = useSelectedDomain();

  useFrontendTool(
    {
      name: "showDistributions",
      description:
        "Find distributions in the current domain by base path and show their URLs and what each serves: a repository, a repository version, a publication, or nothing. Use it when content at a URL is missing or returns 404.",
      parameters,
      handler: ({ basePath }) =>
        refuseForbidden({
          action: "list distributions",
          read: async () => {
            const page = await queryClient.query(
              distributionsListQueryOptions({
                domain,
                params: distributionSearchParams(basePath),
              }),
            );
            const serves = async (distribution: DistributionResponse) => {
              if (distribution.repository) {
                return publishes(distribution.repository)
                  ? "the latest publication of a repository; nothing until it is published"
                  : "the latest repository version";
              }
              if (!needsDetail(distribution)) {
                return "a fixed repository version";
              }
              const detail = await queryClient.query(
                distributionDetailQueryOptions({
                  href: distribution.pulp_href ?? null,
                }),
              );
              return publicationOf(detail) ? "a publication" : "nothing";
            };
            return {
              count: page.count,
              shown: await Promise.all(
                page.results.map(async (distribution) => ({
                  name: distribution.name,
                  basePath: distribution.base_path,
                  url: distribution.base_url,
                  serves: await serves(distribution),
                })),
              ),
            };
          },
        }),
      render: ({ args, status }) =>
        status === ToolCallStatus.InProgress || !args.basePath ? (
          <Skeleton screenreaderText="Looking up distributions" />
        ) : (
          <DistributionSearchResults basePath={args.basePath} />
        ),
    },
    [queryClient, domain],
  );
};
