import { useDistributionSearchTool } from "./distributions/useDistributionSearchTool";
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
};
