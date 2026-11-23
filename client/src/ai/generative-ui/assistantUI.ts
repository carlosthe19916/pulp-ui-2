import { createGenerativeUI } from "@copilotkit/react-core/v2/generative-ui";
import { z } from "zod";

import { DistributionSearchResults } from "../tools/distributions/DistributionSearchResults";
import { RepositorySearchResults } from "../tools/repositories/RepositorySearchResults";
import { RepositoryStatus } from "../tools/repositories/RepositoryStatus";
import { SystemStatus } from "../tools/status/SystemStatus";
import { TASK_STATES } from "../tools/tasks/taskListParams";
import { TaskResults } from "../tools/tasks/TaskResults";
import { Grid, Section, Stack, Text } from "./layout";

/**
 * What the assistant can compose views from. The model picks the layout; the Pulp cards
 * take only what identifies their subject and read their data from Pulp themselves.
 */
export const assistantUI = createGenerativeUI({
  id: "pulp-ui/assistant@1",
  components: {
    Stack: {
      component: Stack,
      description: "Shows its children one under the other.",
      slots: { children: "multiple" },
    },
    Grid: {
      component: Grid,
      description:
        "Shows its children side by side when there is room, for comparing things.",
      slots: { children: "multiple" },
    },
    Section: {
      component: Section,
      description: "A titled group of children.",
      props: z.object({ title: z.string() }),
      slots: { children: "multiple" },
    },
    Text: {
      component: Text,
      description:
        "One short sentence of your own. Never put Pulp data in it: the Pulp cards show the data.",
      props: z.object({ text: z.string() }),
    },
    RepositoryStatus: {
      component: RepositoryStatus,
      description:
        "One repository's latest version and content, last sync and error, publications, remote and distributions, read from Pulp.",
      props: z.object({
        name: z.string().describe("The exact repository name"),
      }),
    },
    RepositorySearchResults: {
      component: RepositorySearchResults,
      description:
        "The repositories whose name contains the text, read from Pulp.",
      props: z.object({ name: z.string() }),
    },
    TaskResults: {
      component: TaskResults,
      description:
        "The newest failed, running or waiting tasks with their error, progress or what holds them, read from Pulp.",
      props: z.object({
        state: z.enum(TASK_STATES),
        name: z
          .string()
          .optional()
          .describe("Part of the task name, e.g. sync"),
      }),
    },
    DistributionSearchResults: {
      component: DistributionSearchResults,
      description:
        "The distributions whose base path contains the text, with their URL and what they serve, read from Pulp.",
      props: z.object({ basePath: z.string() }),
    },
    SystemStatus: {
      component: SystemStatus,
      description:
        "The health of the Pulp instance: services, workers, storage and versions, read from Pulp.",
    },
  },
});
