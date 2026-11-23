import { useFindEndpointsTool } from "./api/useFindEndpointsTool";
import { usePulpGetTool } from "./api/usePulpGetTool";
import { useDistributionSearchTool } from "./distributions/useDistributionSearchTool";
import { useReadGuideTool } from "./guides/useReadGuideTool";
import { useRepositorySearchTool } from "./repositories/useRepositorySearchTool";
import { useRepositoryStatusTool } from "./repositories/useRepositoryStatusTool";
import { useSystemStatusTool } from "./status/useSystemStatusTool";
import { useTaskListTool } from "./tasks/useTaskListTool";

/** Every tool the assistant can use, in one list: each one is part of every request to the model. */
export const useAssistantTools = () => {
  useRepositorySearchTool();
  useRepositoryStatusTool();
  useTaskListTool();
  useDistributionSearchTool();
  useSystemStatusTool();
  useFindEndpointsTool();
  usePulpGetTool();
  useReadGuideTool();
};
