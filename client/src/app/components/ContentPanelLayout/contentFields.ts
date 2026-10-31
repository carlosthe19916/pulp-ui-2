import type React from "react";

export interface IContentPanelProps {
  href: string;
  /** The repository version the unit is browsed in, when there is one. */
  versionHref?: string;
}

export interface IFact {
  term: string;
  value: React.ReactNode;
}

export interface ILink {
  label: string;
  url: string;
}

const isPresent = (value: unknown) => value != null && value !== "";

export const facts = (values: Record<string, React.ReactNode>): IFact[] =>
  Object.entries(values)
    .filter(([, value]) => isPresent(value))
    .map(([term, value]) => ({ term, value }));

/** Only http(s) URLs are rendered as links; upstream metadata is untrusted. */
export const links = (urls: Record<string, unknown>): ILink[] =>
  Object.entries(urls)
    .filter(
      (pair): pair is [string, string] =>
        typeof pair[1] === "string" && /^https?:\/\//i.test(pair[1]),
    )
    .map(([label, url]) => ({ label, url }));

/** An untyped (`unknown`) list field read as `T[]`; `[]` when it isn't an array. */
export const asArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

export const asStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

export const asStringRecord = (value: unknown): Record<string, string> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(
        Object.entries(value).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        ),
      )
    : {};

export const basename = (path?: string) => path?.split("/").pop() ?? "";

export const dirname = (path?: string) =>
  path?.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
