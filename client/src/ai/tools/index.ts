import { useRepositorySearchTool } from "./repositories/useRepositorySearchTool";

/** Every tool the assistant can use, in one list: each one is part of every request to the model. */
export const useAssistantTools = () => {
  useRepositorySearchTool();
};
