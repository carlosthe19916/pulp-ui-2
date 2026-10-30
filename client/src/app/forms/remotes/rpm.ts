import type { RemotesRpmRpmCreateData } from "@app/client";

import { nameField, urlField } from "../fragments/base";
import {
  authSection,
  connectionSections,
  POLICY_OPTIONS,
  policyField,
} from "../fragments/remoteNetwork";
import { defineForm } from "../kit/defineForm";

/** An RPM remote syncs a yum/dnf repository. */
export const rpmRemoteForm = defineForm<RemotesRpmRpmCreateData["body"]>()(
  ({ f, s }) => ({
    title: { create: "Create RPM remote", edit: "Edit RPM remote" },
    docsUrl: "https://pulpproject.org/pulp_rpm/",
    sections: [
      s.essentials([
        nameField(f),
        urlField(f, {
          help: "The repository root holding repodata/, e.g. https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/.",
        }),
        policyField(f, [
          POLICY_OPTIONS.immediate,
          POLICY_OPTIONS.on_demand,
          POLICY_OPTIONS.streamed,
        ]),
      ]),
      s.collapsible("auth", "Authentication", [
        ...authSection(f),
        f.text("sles_auth_token", {
          label: "SLES authentication token",
          help: "Needed only to sync SUSE Linux Enterprise Server repositories.",
        }),
      ]),
      ...connectionSections({ f, s }),
    ],
  }),
);
