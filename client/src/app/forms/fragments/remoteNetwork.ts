import type { AnySchema, NumberSchema } from "yup";

import type { IFieldBuilders } from "../kit/defineForm";
import type { IFormContext } from "../kit/types";

/**
 * Remote settings shared by pulpcore's RemoteSerializer, as collapsible sections a plugin
 * places after its essentials. Each is generic over the body keys it renders.
 */

/** Download policies; a plugin offers the ones its enum allows. */
export const POLICY_OPTIONS = {
  immediate: {
    value: "immediate",
    label: "Immediate",
    description: "Download all content during sync.",
  },
  on_demand: {
    value: "on_demand",
    label: "On demand",
    description:
      "Download content when a client first requests it, then keep it.",
  },
  streamed: {
    value: "streamed",
    label: "Streamed",
    description: "Stream content to clients without storing it.",
  },
} as const;

const positiveInteger = (label: string) => ({
  validate: (schema: AnySchema) =>
    (schema as NumberSchema)
      .integer(`${label} must be a whole number`)
      .min(1, `${label} must be at least 1`),
});

export const authSection = <
  T extends { username?: unknown; password?: unknown },
>(
  f: IFieldBuilders<T>,
) => [
  f.row([
    f.secret("username", { label: "Username" }),
    f.secret("password", { label: "Password" }),
  ]),
];

interface ITlsKeys {
  tls_validation?: unknown;
  ca_cert?: unknown;
  client_cert?: unknown;
  client_key?: unknown;
}

export const tlsSummary = ({ values }: IFormContext): string | undefined =>
  values.tls_validation === false ? "Verify off" : undefined;

export const tlsSection = <T extends ITlsKeys>(f: IFieldBuilders<T>) => [
  f.switch("tls_validation", {
    label: "Verify the server's TLS certificate",
    defaultValue: true,
  }),
  f.code("ca_cert", {
    label: "CA certificate",
    language: "pem",
    downloadName: "ca-cert",
    help: "A PEM-encoded CA certificate used to validate the server.",
  }),
  f.code("client_cert", {
    label: "Client certificate",
    language: "pem",
    downloadName: "client-cert",
    help: "A PEM-encoded client certificate used for authentication.",
  }),
  f.secret("client_key", {
    label: "Client private key",
    editor: "pem",
    help: "The PEM-encoded private key of the client certificate.",
  }),
];

interface IProxyKeys {
  proxy_url?: unknown;
  proxy_username?: unknown;
  proxy_password?: unknown;
}

export const proxySummary = ({ values }: IFormContext): string | undefined =>
  typeof values.proxy_url === "string" && values.proxy_url !== ""
    ? values.proxy_url
    : undefined;

export const proxySection = <T extends IProxyKeys>(f: IFieldBuilders<T>) => [
  f.url("proxy_url", {
    label: "Proxy URL",
    placeholder: "http://proxy.example.com:3128",
  }),
  f.row([
    f.secret("proxy_username", { label: "Proxy username" }),
    f.secret("proxy_password", { label: "Proxy password" }),
  ]),
];

interface IDownloadKeys {
  download_concurrency?: unknown;
  rate_limit?: unknown;
  max_retries?: unknown;
  headers?: unknown;
}

export const downloadsSection = <T extends IDownloadKeys>(
  f: IFieldBuilders<T>,
) => [
  f.row([
    f.number("download_concurrency", {
      label: "Download concurrency",
      help: "How many files to download at the same time.",
      ...positiveInteger("Download concurrency"),
    }),
    f.number("rate_limit", {
      label: "Rate limit",
      help: "The maximum number of requests per second to the server.",
      ...positiveInteger("Rate limit"),
    }),
    f.number("max_retries", {
      label: "Max retries",
      help: "How many times a failed download is retried.",
    }),
  ]),
  f.keyValue("headers", {
    label: "Header",
    shape: "headers",
    help: "Extra HTTP headers sent with every request to the server.",
  }),
];

interface ITimeoutKeys {
  total_timeout?: unknown;
  connect_timeout?: unknown;
  sock_connect_timeout?: unknown;
  sock_read_timeout?: unknown;
}

export const timeoutsSection = <T extends ITimeoutKeys>(
  f: IFieldBuilders<T>,
) => [
  f.row([
    f.number("total_timeout", { label: "Total (seconds)" }),
    f.number("connect_timeout", { label: "Connect (seconds)" }),
  ]),
  f.row([
    f.number("sock_connect_timeout", { label: "Socket connect (seconds)" }),
    f.number("sock_read_timeout", { label: "Socket read (seconds)" }),
  ]),
];
