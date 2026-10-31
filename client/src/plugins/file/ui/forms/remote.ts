import type { RemotesFileFileCreateData } from "@app/client";

import { nameField, urlField } from "../fragments/base";
import {
  authSection,
  connectionSections,
  POLICY_OPTIONS,
  policyField,
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
        policyField(f, [
          POLICY_OPTIONS.immediate,
          POLICY_OPTIONS.on_demand,
          POLICY_OPTIONS.streamed,
        ]),
      ]),
      s.collapsible("auth", "Authentication", authSection(f)),
      ...connectionSections({ f, s }),
    ],
  }),
);
