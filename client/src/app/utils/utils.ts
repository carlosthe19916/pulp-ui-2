import axios, { type AxiosError } from "axios";
import dayjs from "dayjs";

import { RENDER_DATETIME_FORMAT, RENDER_DATE_FORMAT } from "@app/Constants";
import type { ToolbarLabel } from "@patternfly/react-core";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAxiosErrorMessage = (axiosError: AxiosError<any>) => {
  if (axiosError.response?.data?.errorMessage) {
    return axiosError.response.data.errorMessage;
  }
  if (
    axiosError.response?.data?.error &&
    typeof axiosError?.response?.data?.error === "string"
  ) {
    return axiosError?.response?.data?.error;
  }
  return axiosError.message;
};

/** Build a user-facing mutation failure message, surfacing Pulp 403/validation detail when available. */
export const getMutationErrorMessage = (
  error: unknown,
  fallback: string,
): { title: string; description?: string } => {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error && error.message) {
      return { title: fallback, description: error.message };
    }
    return { title: fallback };
  }

  const status = error.response?.status;
  const data = error.response?.data as
    | {
        detail?: unknown;
        non_field_errors?: unknown;
        error?: unknown;
        errorMessage?: unknown;
      }
    | undefined;

  if (status === 403) {
    return {
      title: fallback,
      description:
        "You do not have permission to perform this action. Ask an administrator to grant the required role.",
    };
  }

  const detail =
    (typeof data?.detail === "string" && data.detail) ||
    (typeof data?.errorMessage === "string" && data.errorMessage) ||
    (typeof data?.error === "string" && data.error) ||
    (Array.isArray(data?.non_field_errors) &&
      data.non_field_errors.filter((x) => typeof x === "string").join(" ")) ||
    (data?.detail && typeof data.detail === "object"
      ? JSON.stringify(data.detail)
      : undefined) ||
    error.message;

  return detail && detail !== fallback
    ? { title: fallback, description: detail }
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

export const duplicateFieldCheck = <T>(
  fieldKey: keyof T,
  itemList: T[],
  currentItem: T | null,
  fieldValue: T[keyof T],
) =>
  (currentItem && currentItem[fieldKey] === fieldValue) ||
  !itemList.some((item) => item[fieldKey] === fieldValue);

export const duplicateNameCheck = <T extends { name?: string }>(
  itemList: T[],
  currentItem: T | null,
  nameValue: T["name"],
) => duplicateFieldCheck("name", itemList, currentItem, nameValue);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dedupeFunction = (arr: any[]) =>
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

export const getValidatedFromErrors = (
  error: unknown | undefined,
  dirty: boolean | undefined,
  isTouched: boolean | undefined,
  isSubmitted?: boolean,
) => {
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
