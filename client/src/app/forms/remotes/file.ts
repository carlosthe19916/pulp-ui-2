import type { RemotesFileFileCreateData } from "@app/client";

import { nameField, urlField } from "../fragments/base";
import { labelsField } from "../fragments/labels";
import {
  authSection,
  downloadsSection,
  POLICY_OPTIONS,
  proxySection,
  proxySummary,
  timeoutsSection,
  tlsSection,
  tlsSummary,
} from "../fragments/remoteNetwork";
import { defineForm } from "../kit/defineForm";

/** A file remote syncs the files listed in a `PULP_MANIFEST`. */
export const fileRemoteForm = defineForm<RemotesFileFileCreateData["body"]>()(
  ({ f, s }) => ({
    title: { create: "Create file remote", edit: "Edit file remote" },
    docsUrl: "https://pulpproject.org/pulp_file/",
    sections: [
      s.essentials([
        nameField(f),
        urlField(f, {
          help: "The URL of the PULP_MANIFEST that lists the files to sync, e.g. https://example.com/files/PULP_MANIFEST.",
        }),
        f.select("policy", {
          kind: "radio",
          label: "Download policy",
          defaultValue: "immediate",
          options: [
            POLICY_OPTIONS.immediate,
            POLICY_OPTIONS.on_demand,
            POLICY_OPTIONS.streamed,
          ],
        }),
      ]),
      s.collapsible("auth", "Authentication", authSection(f)),
      s.collapsible("tls", "TLS", tlsSection(f), { summary: tlsSummary }),
      s.collapsible("proxy", "Proxy", proxySection(f), {
        summary: proxySummary,
      }),
      s.collapsible("downloads", "Downloads", downloadsSection(f)),
      s.collapsible("timeouts", "Timeouts", timeoutsSection(f)),
      s.collapsible("labels", "Labels", [labelsField(f)]),
    ],
  }),
);
