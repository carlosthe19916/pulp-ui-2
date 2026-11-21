import type { TaskResponse } from "@app/client";
import { getTaskErrorMessage } from "@app/utils/utils";

/** Enough of a traceback for the model to explain it, not the whole thing. */
const ERROR_LENGTH = 500;

export const taskErrorForModel = (task: TaskResponse): string | undefined =>
  getTaskErrorMessage(task)?.slice(0, ERROR_LENGTH);
