import {
  authSection,
  connectionSections,
  nameField,
  POLICY_OPTIONS,
  policyField,
  urlField,
} from "@app/forms/fragments";
import { remoteForm } from "@plugin-sdk/ui";

import { rpm } from "../../definition";

/** An RPM remote syncs a yum/dnf repository. */
export const rpmRemoteForm = remoteForm(rpm.remote["rpm.rpm"])(({ f, s }) => ({
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
}));
