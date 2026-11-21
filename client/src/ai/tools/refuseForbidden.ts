import { isForbiddenError } from "@app/utils/isHttpError";

/** Runs a tool's read; a 403 becomes a refusal the model can relay instead of an error. */
export const refuseForbidden = async <T>({
  action,
  read,
}: {
  action: string;
  read: () => Promise<T>;
}): Promise<T | { error: string }> => {
  try {
    return await read();
  } catch (error) {
    if (isForbiddenError(error)) {
      return { error: `The user isn't allowed to ${action}.` };
    }
    throw error;
  }
};
