import { useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";

import { Content } from "@patternfly/react-core";

import { findEndpoints } from "./findEndpoints";

const parameters = z.object({
  query: z
    .string()
    .describe(
      "Words describing what to read, e.g. 'rpm packages', 'remotes', 'roles of an object'",
    ),
});

/** Lets the assistant look up Pulp API endpoints and their filters, like `--help`. */
export const useFindEndpointsTool = () => {
  useFrontendTool({
    name: "findEndpoints",
    description:
      "Search the Pulp API's GET endpoints and their filters. Paths are relative to api/v3/; '{href}x/' means x/ appended to an object's pulp_href. Every list also takes limit, offset, ordering and fields.",
    parameters,
    handler: async ({ query }) => ({ matches: findEndpoints(query) }),
    // Shown like a CLI echoes its command, so the user sees how the answer was found.
    render: ({ args }) =>
      args.query ? (
        <Content component="small">
          Looked up the API for "{args.query}"
        </Content>
      ) : null,
  });
};
