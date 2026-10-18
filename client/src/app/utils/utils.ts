import axios from "axios";
import dayjs from "dayjs";

import { RENDER_DATETIME_FORMAT, RENDER_DATE_FORMAT } from "@app/Constants";
import type {
  IErrorsEnvelopeData,
  PulpErrorData,
} from "@app/queries/utils/openapiErrorTypes";
import type { ToolbarLabel } from "@patternfly/react-core";

/** A user-facing mutation failure message: an Alert/toast title plus optional detail. */
export type IMutationErrorMessage = { title: string; description?: string };

const PERMISSION_DENIED_DESCRIPTION =
  "You do not have permission to perform this action. Ask an administrator to grant the required role.";

/** "snake_case_field" → "Snake case field" for field-level error labels. */
const humanizeFieldKey = (key: string): string => {
  const spaced = key.replace(/_/g, " ").trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : key;
};

/** Flatten a DRF field value (string, string[], or nested dict) to one message. */
const describeFieldValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => describeFieldValue(item))
      .filter(Boolean)
      .join(" ");
  }
  if (value && typeof value === "object") {
    return describeFieldErrors(value as Record<string, unknown>);
  }
  return "";
};

/** Render a DRF validation dict: `non_field_errors` unprefixed, others `Field: msgs`. */
const describeFieldErrors = (data: Record<string, unknown>): string =>
  Object.entries(data)
    .map(([key, value]) => {
      const message = describeFieldValue(value);
      if (!message) return "";
      if (key === "non_field_errors" || key === "detail") return message;
      return `${humanizeFieldKey(key)}: ${message}`;
    })
    .filter(Boolean)
    .join("; ");

/** Join the messages of a container `/v2/` or Galaxy v3 `errors[]` envelope. */
const describeErrorsEnvelope = (
  errors: { message?: string; title?: string; detail?: unknown }[],
): string =>
  errors
    .map((item) => {
      const primary = item.message ?? item.title ?? "";
      const detail = typeof item.detail === "string" ? item.detail : "";
      return detail && detail !== primary ? `${primary} — ${detail}` : primary;
    })
    .filter(Boolean)
    .join("; ");

/** Extract a human description from any Pulp error body, or undefined if none. */
const describePulpError = (
  data: PulpErrorData | undefined,
): string | undefined => {
  if (!data) return undefined;
  // Non-JSON body (e.g. pulp_hugging_face content-proxy) arrives as a plain string.
  if (typeof data === "string") return data || undefined;
  // Bare-array 400 (list serializer / bare ValidationError).
  if (Array.isArray(data)) {
    const message = data
      .map((item) => describeFieldValue(item))
      .filter(Boolean)
      .join("; ");
    return message || undefined;
  }
  // container /v2/ and Galaxy v3 `errors[]` envelopes.
  if ("errors" in data && Array.isArray(data.errors)) {
    return (
      describeErrorsEnvelope((data as IErrorsEnvelopeData).errors) || undefined
    );
  }
  // Plugin custom views: `{ error, detail? }` (an `error` string key is unambiguous).
  if (typeof (data as { error?: unknown }).error === "string") {
    const { error, detail } = data as { error: string; detail?: unknown };
    return typeof detail === "string" && detail !== error
      ? `${error} — ${detail}`
      : error;
  }
  // Stock DRF dict: `{ detail }`, `{ non_field_errors }`, and/or per-field errors.
  const message = describeFieldErrors(data as Record<string, unknown>);
  return message || undefined;
};

/** Build a user-facing mutation failure message, surfacing Pulp/DRF error detail when available. */
export const getMutationErrorMessage = ({
  error,
  fallback,
}: {
  error: unknown;
  fallback: string;
}): IMutationErrorMessage => {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error && error.message) {
      return { title: fallback, description: error.message };
    }
    return { title: fallback };
  }

  if (error.response?.status === 403) {
    return { title: fallback, description: PERMISSION_DENIED_DESCRIPTION };
  }

  const data = error.response?.data as PulpErrorData | undefined;
  const description = describePulpError(data) || error.message;

  return description && description !== fallback
    ? { title: fallback, description }
    : { title: fallback };
};

export const getToolbarChipKey = (value: string | ToolbarLabel) => {
  return typeof value === "string" ? value : value.key;
};

export const formatDate = (value?: string | null) => {
  return value ? dayjs.utc(value).local().format(RENDER_DATE_FORMAT) : null;
};

export const formatDateTime = (value?: string | null) => {
  return value ? dayjs.utc(value).local().format(RENDER_DATETIME_FORMAT) : null;
};

interface IDuplicateFieldCheckParams<T> {
  fieldKey: keyof T;
  itemList: T[];
  currentItem: T | null;
  fieldValue: T[keyof T];
}

export const duplicateFieldCheck = <T>({
  fieldKey,
  itemList,
  currentItem,
  fieldValue,
}: IDuplicateFieldCheckParams<T>) =>
  (currentItem && currentItem[fieldKey] === fieldValue) ||
  !itemList.some((item) => item[fieldKey] === fieldValue);

interface IDuplicateNameCheckParams<T extends { name?: string }> {
  itemList: T[];
  currentItem: T | null;
  nameValue: T["name"];
}

export const duplicateNameCheck = <T extends { name?: string }>({
  itemList,
  currentItem,
  nameValue,
}: IDuplicateNameCheckParams<T>) =>
  duplicateFieldCheck({
    fieldKey: "name",
    itemList,
    currentItem,
    fieldValue: nameValue,
  });

export const dedupeFunction = <T extends { value: unknown }>(arr: T[]) =>
  arr?.filter(
    (value, index, self) =>
      index === self.findIndex((t) => t.value === value.value),
  );

export const numStr = (num: number | undefined): string => {
  if (num === undefined) return "";
  return String(num);
};

export const parseMaybeNumericString = (
  numOrStr: string | undefined | null,
): string | number | null => {
  if (numOrStr === undefined || numOrStr === null) return null;
  const num = Number(numOrStr);
  return Number.isNaN(num) ? numOrStr : num;
};

export const objectKeys = <T extends object>(obj: T) =>
  Object.keys(obj) as (keyof T)[];

interface IGetValidatedFromErrorsParams {
  error: unknown | undefined;
  dirty: boolean | undefined;
  isTouched: boolean | undefined;
  isSubmitted?: boolean;
}

export const getValidatedFromErrors = ({
  error,
  dirty,
  isTouched,
  isSubmitted,
}: IGetValidatedFromErrorsParams) => {
  return error && (dirty || isTouched || isSubmitted) ? "error" : "default";
};

export const getValidatedFromError = (error: unknown | undefined) => {
  return error ? "error" : "default";
};

export const localeNumericCompare = (
  a: string,
  b: string,
  locale: string,
): number => a.localeCompare(b, locale ?? "en", { numeric: true });

export const getString = (input: string | (() => string)) =>
  typeof input === "function" ? input() : input;

export const getFilenameFromContentDisposition = (
  contentDisposition: string,
): string | null => {
  const match = contentDisposition.match(/filename="?([^"]+)"?/);
  return match ? match[1] : null;
};

/**
 * Compare any values by converting to string (nullish → empty string).
 * @see localeNumericCompare
 */
export const universalComparator = (
  a: string | number | null | undefined,
  b: string | number | null | undefined,
  locale: string,
) => {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  return localeNumericCompare(String(a ?? ""), String(b ?? ""), locale);
};

export const parseBooleanIfPossible = (value?: string): boolean => {
  return value?.toLocaleLowerCase() === "true";
};

export const toCamelCase = (value: string) => {
  return value.charAt(0).toUpperCase() + value.slice(1).replace("_", " ");
};
