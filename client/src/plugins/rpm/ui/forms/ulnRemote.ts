import type { StringSchema } from "yup";

import {
  connectionSections,
  nameField,
  POLICY_OPTIONS,
  policyField,
} from "@app/forms/fragments";
import { remoteForm } from "@plugin-sdk/ui";

import { rpm } from "../../definition";

/** A ULN remote syncs an Oracle Unbreakable Linux Network channel; it needs credentials. */
export const rpmUlnRemoteForm = remoteForm(rpm.remote["rpm.uln"])(
  ({ f, s }) => ({
    title: { create: "Create ULN remote", edit: "Edit ULN remote" },
    docsUrl: "https://pulpproject.org/pulp_rpm/",
    sections: [
      s.essentials([
        nameField(f),
        // A ULN channel is a uln:// address, which an http(s) URL check rejects.
        f.text("url", {
          label: "URL",
          required: true,
          placeholder: "uln://ol8_x86_64_baseos_latest",
          help: "The ULN channel, e.g. uln://ol8_x86_64_baseos_latest.",
          validate: (schema) =>
            (schema as StringSchema).matches(/^uln:\/\/\S+$/, {
              message: "URL must be a uln:// channel address",
              excludeEmptyString: true,
            }),
        }),
        f.row([
          f.secret("username", { label: "ULN username", required: "create" }),
          f.secret("password", { label: "ULN password", required: "create" }),
        ]),
        policyField(f, [
          POLICY_OPTIONS.immediate,
          POLICY_OPTIONS.on_demand,
          POLICY_OPTIONS.streamed,
        ]),
      ]),
      s.collapsible("uln", "ULN server", [
        f.url("uln_server_base_url", {
          label: "ULN server base URL",
          help: "Empty uses the server's DEFAULT_ULN_SERVER_BASE_URL setting.",
        }),
      ]),
      ...connectionSections({ f, s }),
    ],
  }),
);
