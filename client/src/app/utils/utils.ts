import axios from "axios";
import dayjs from "dayjs";

import type { ToolbarLabel } from "@patternfly/react-core";

import type { TaskResponse } from "@app/client";
import { RENDER_DATE_FORMAT, RENDER_DATETIME_FORMAT } from "@app/constants";
import type {
  IErrorsEnvelopeData,
  PulpErrorData,
  TaskWithError,
} from "@app/queries/utils/openapiErrorTypes";

/** A user-facing mutation failure message: an Alert/toast title plus optional detail. */
export interface IMutationErrorMessage {
  title: string;
  description?: string;
}

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
  // Plugin custom views: `{ error, detail? }`. Only treat a string `error` key as this
  // shape when the body carries nothing but `error`/`detail` — otherwise it is a DRF
  // validation dict that happens to have a field literally named `error`, and must fall
  // through to `describeFieldErrors` so the other field errors aren't dropped.
  if (typeof (data as { error?: unknown }).error === "string") {
    const keys = Object.keys(data);
    const isPluginShape = keys.every((k) => k === "error" || k === "detail");
    if (isPluginShape) {
      const { error, detail } = data as { error: string; detail?: unknown };
      return typeof detail === "string" && detail !== error
        ? `${error} — ${detail}`
        : error;
    }
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
    // Prefer the server's specific reason when present, over the canned message.
    const detail = describePulpError(
      error.response?.data as PulpErrorData | undefined,
    );
    return {
      title: fallback,
      description: detail
        ? `${PERMISSION_DENIED_DESCRIPTION} ${detail}`
        : PERMISSION_DENIED_DESCRIPTION,
    };
  }

  const data = error.response?.data as PulpErrorData | undefined;
  const description = describePulpError(data) || error.message;

  return description && description !== fallback
    ? { title: fallback, description }
    : { title: fallback };
};

/**
 * Failure message from a terminal task's `error`, which the generated client drops (see
 * `TaskWithError`); `undefined` when it has none.
 */
export const getTaskErrorMessage = (
  task: TaskResponse | undefined,
): string | undefined => {
  if (!task) return undefined;
  const { error } = task as TaskWithError;
  if (error) {
    if (typeof error.description === "string" && error.description) {
      return error.description;
    }
    if (typeof error.reason === "string" && error.reason) return error.reason;
    const serialized = JSON.stringify(error);
    if (serialized && serialized !== "{}") return serialized;
  }
  const { result } = task;
  if (typeof result === "string" && result) return result;
  return undefined;
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

export const getString = (input: string | (() => string)) =>
  typeof input === "function" ? input() : input;

export const getFilenameFromContentDisposition = (
  contentDisposition: string,
): string | null => {
  const match = contentDisposition.match(/filename="?([^"]+)"?/);
  return match ? match[1] : null;
};

export const parseBooleanIfPossible = (value?: string): boolean => {
  return value?.toLocaleLowerCase() === "true";
};

export const toCamelCase = (value: string) => {
  return value.charAt(0).toUpperCase() + value.slice(1).replace("_", " ");
};

/** `null`/`undefined`, `""`, `[]` or `{}` — a field value with nothing to show. */
export const isEmptyValue = (value: unknown): boolean =>
  value == null ||
  value === "" ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as object).length === 0);
