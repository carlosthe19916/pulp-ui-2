import type { AsyncOperationResponse } from "@app/client";
import { useRecentTasksStore } from "@app/stores/useRecentTasksStore";

/**
 * Remembers a task this browser started, for the dashboard's recent tasks (the Tasks API
 * can't filter by creator). Called by each write whose spec answers `202` with a task.
 */
export const recordTask = (
  response: AsyncOperationResponse,
): AsyncOperationResponse => {
  useRecentTasksStore.getState().record(response.task);
  return response;
};
