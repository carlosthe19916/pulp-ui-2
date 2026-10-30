import type { RemotesRpmUlnCreateData } from "@app/client";

import { nameField, urlField } from "../fragments/base";
import {
  connectionSections,
  POLICY_OPTIONS,
  policyField,
} from "../fragments/remoteNetwork";
import { defineForm } from "../kit/defineForm";

/** A ULN remote syncs an Oracle Unbreakable Linux Network channel; it needs credentials. */
export const rpmUlnRemoteForm = defineForm<RemotesRpmUlnCreateData["body"]>()(
  ({ f, s }) => ({
    title: { create: "Create ULN remote", edit: "Edit ULN remote" },
    docsUrl: "https://pulpproject.org/pulp_rpm/",
    sections: [
      s.essentials([
        nameField(f),
        urlField(f, {
          help: "The ULN channel, e.g. uln://ol8_x86_64_baseos_latest.",
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
