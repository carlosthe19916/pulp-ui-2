import { isForbiddenError } from "@app/utils/isHttpError";

export interface IUnavailable {
  unavailable: string;
}

const isUnavailable = (value: unknown): value is IUnavailable =>
  typeof value === "object" && value !== null && "unavailable" in value;

/** One side read failing doesn't hide the others from the model. */
export const readSeparately = <T>(
  read: Promise<T>,
): Promise<T | IUnavailable> =>
  read.catch((error: unknown) => ({
    unavailable: isForbiddenError(error)
      ? "The user isn't allowed to read it."
      : "It could not be loaded.",
  }));

/** Summarizes a read that succeeded; passes a skipped or failed one through. */
export const summarize = <T, R>(
  value: T | IUnavailable | undefined,
  toSummary: (value: T) => R,
): R | IUnavailable | undefined => {
  if (value === undefined) return undefined;
  if (isUnavailable(value)) return value;
  return toSummary(value);
};
