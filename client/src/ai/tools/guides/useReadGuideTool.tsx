import { useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";

import { Content } from "@patternfly/react-core";

import { GUIDE_TOPICS, GUIDES } from "./guides";

const parameters = z.object({ topic: z.enum(GUIDE_TOPICS) });

/** Lets the assistant read a short guide when it needs Pulp knowledge, like a skill. */
export const useReadGuideTool = () => {
  useFrontendTool({
    name: "readGuide",
    description:
      "Read a short Pulp guide before answering about it: concepts, artifactory (mapping from Artifactory), find-content (where a package is, what a version changed), serving (distributions, publications, 404s), tasks, client-setup, api (filters, q, paging).",
    parameters,
    handler: async ({ topic }) => ({ guide: GUIDES[topic] }),
    render: ({ args }) =>
      args.topic ? (
        <Content component="small">Read the "{args.topic}" guide</Content>
      ) : null,
  });
};
