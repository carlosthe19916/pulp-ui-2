import { defineForm } from "./defineForm";
import type { IFormDef } from "./types";

/** A test body covering every field kind the derivations treat differently. */
interface ITestBody {
  name: string;
  url: string;
  description?: string | null;
  policy?: "immediate" | "on_demand";
  tls_validation?: boolean;
  ca_cert?: string | null;
  password?: string | null;
  token?: string | null;
  download_concurrency?: number | null;
  include_tags?: string[] | null;
  headers?: unknown[];
  pulp_labels?: Record<string, string>;
  requirements_file?: string | null;
}

/** A form exercising the kit: essentials plus collapsible sections and conditions. */
export const testForm: IFormDef = defineForm<ITestBody>()(({ f, s }) => ({
  title: { create: "Create widget", edit: "Edit widget" },
  sections: [
    s.essentials([
      f.text("name", { label: "Name", required: true }),
      f.url("url", { label: "URL", required: true }),
      f.textarea("description", { label: "Description" }),
      f.select("policy", {
        label: "Policy",
        options: [
          { value: "immediate", label: "Immediate" },
          { value: "on_demand", label: "On demand" },
        ],
      }),
      f.code("requirements_file", {
        label: "Requirements",
        language: "yaml",
        visibleWhen: ({ values }) => values.policy === "immediate",
      }),
    ]),
    s.collapsible("auth", "Authentication", [
      f.secret("password", { label: "Password", required: "create" }),
      f.secret("token", {
        label: "Token",
        visibleWhen: ({ values }) => values.policy === "on_demand",
      }),
    ]),
    s.collapsible("tls", "TLS", [
      f.switch("tls_validation", { label: "Verify TLS", defaultValue: true }),
      f.code("ca_cert", { label: "CA certificate", language: "pem" }),
    ]),
    s.collapsible("network", "Network", [
      f.number("download_concurrency", { label: "Concurrency" }),
      f.stringList("include_tags", { label: "Include tags" }),
      f.keyValue("headers", { label: "Header", shape: "headers" }),
    ]),
    s.collapsible("labels", "Labels", [
      f.keyValue("pulp_labels", {
        label: "Label",
        shape: "labels",
        availability: "createOnly",
      }),
    ]),
  ],
}));
