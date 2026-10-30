/**
 * Compile-time checks of `defineForm` (run by `tsc`, never executed): each
 * `@ts-expect-error` marks a definition that must not compile.
 */
import type { RemotesFileFileCreateData } from "@app/client";

import { defineForm, type IFieldBuilders } from "./defineForm";
import type { IFormDef } from "./types";

type FileRemoteBody = RemotesFileFileCreateData["body"];

// A shared fragment is generic over the body keys it renders.
const authFields = <T extends { username?: unknown; password?: unknown }>(
  f: IFieldBuilders<T>,
) => [
  f.text("username", { label: "Username" }),
  f.secret("password", { label: "Password" }),
];

// Covers every key (rendered or omitted): an IFormDef.
export const complete: IFormDef = defineForm<FileRemoteBody>()(({ f, s }) => ({
  title: { create: "Create", edit: "Edit" },
  sections: [
    s.essentials([
      f.text("name", { label: "Name" }),
      f.url("url", { label: "URL" }),
      f.select("policy", {
        label: "Policy",
        options: [{ value: "immediate", label: "Immediate" }],
      }),
    ]),
    s.collapsible("auth", "Authentication", authFields(f)),
  ],
  omit: [
    "pulp_labels",
    "ca_cert",
    "client_cert",
    "client_key",
    "tls_validation",
    "proxy_url",
    "proxy_username",
    "proxy_password",
    "max_retries",
    "total_timeout",
    "connect_timeout",
    "sock_connect_timeout",
    "sock_read_timeout",
    "headers",
    "download_concurrency",
    "rate_limit",
  ],
}));

// @ts-expect-error -- uncovered API keys: not an IFormDef.
export const uncovered: IFormDef = defineForm<FileRemoteBody>()(({ f, s }) => ({
  title: { create: "Create", edit: "Edit" },
  sections: [s.essentials([f.text("name", { label: "Name" })])],
}));

export const wrongKey = defineForm<FileRemoteBody>()(({ f, s }) => ({
  title: { create: "Create", edit: "Edit" },
  // @ts-expect-error -- "nmae" is not a body key.
  sections: [s.essentials([f.text("nmae", { label: "Name" })])],
}));

export const wrongOption = defineForm<FileRemoteBody>()(({ f, s }) => ({
  title: { create: "Create", edit: "Edit" },
  sections: [
    s.essentials([
      f.select("policy", {
        label: "Policy",
        // @ts-expect-error -- "sometimes" is not a policy.
        options: [{ value: "sometimes", label: "Sometimes" }],
      }),
    ]),
  ],
}));

export const missingConstraint = authFields(
  // @ts-expect-error -- a fragment needing `username` can't take a body without it.
  {} as IFieldBuilders<{ url: string }>,
);
