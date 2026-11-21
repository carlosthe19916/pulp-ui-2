import { ToolCallStatus, useFrontendTool } from "@copilotkit/react-core/v2";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { Skeleton } from "@patternfly/react-core";

import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { repositoriesListQueryOptions } from "@app/queries/repositories";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { isForbiddenError } from "@app/utils/isHttpError";

import { repositorySearchParams } from "./repositorySearchParams";
import { RepositorySearchResults } from "./RepositorySearchResults";

const parameters = z.object({
  name: z
    .string()
    .describe("All or part of the repository name, matched case-insensitively"),
});

/** Lets the assistant find repositories by name and show them as a card. */
export const useRepositorySearchTool = () => {
  const queryClient = useQueryClient();
  const domain = useSelectedDomain();

  useFrontendTool(
    {
      name: "showRepositories",
      description:
        "Find repositories in the current domain by name and show them to the user as a list with links and types.",
      parameters,
      // The model gets a summary; the user sees the card the render draws, from the same query.
      handler: async ({ name }) => {
        try {
          const page = await queryClient.query(
            repositoriesListQueryOptions({
              domain,
              params: repositorySearchParams(name),
            }),
          );
          return {
            count: page.count,
            shown: page.results.map((repository) => ({
              name: repository.name,
              type: resolvePulpType(repository.pulp_href),
            })),
          };
        } catch (error) {
          if (isForbiddenError(error)) {
            return { error: "The user isn't allowed to list repositories." };
          }
          throw error;
        }
      },
      // While the arguments stream in, `name` is partial; search only once it is complete.
      render: ({ args, status }) =>
        status === ToolCallStatus.InProgress || !args.name ? (
          <Skeleton screenreaderText="Looking up repositories" />
        ) : (
          <RepositorySearchResults name={args.name} />
        ),
    },
    [queryClient, domain],
  );
};
