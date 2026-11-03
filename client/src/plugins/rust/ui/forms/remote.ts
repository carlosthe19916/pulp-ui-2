import {
  authSection,
  connectionSections,
  nameField,
  POLICY_OPTIONS,
  policyField,
  SECTION_IDS,
  urlField,
} from "@app/plugin-forms/fragments";
import { remoteForm } from "@plugin-sdk/ui";

import { rust } from "../../definition";

/** A Rust remote points at a Cargo sparse index, crates.io or a private one. */
export const rustRemoteForm = remoteForm(rust.remote["rust.rust"])(
  ({ f, s }) => ({
    title: { create: "Create Rust remote", edit: "Edit Rust remote" },
    docsUrl: "https://pulpproject.org/pulp_rust/",
    sections: [
      s.essentials([
        nameField(f),
        urlField(f, {
          help: "The sparse index, e.g. sparse+https://index.crates.io/.",
        }),
        policyField(f, [
          POLICY_OPTIONS.on_demand,
          POLICY_OPTIONS.immediate,
          POLICY_OPTIONS.streamed,
        ]),
      ]),
      s.collapsible(SECTION_IDS.auth, "Authentication", authSection(f)),
      ...connectionSections({ f, s }),
    ],
  }),
);
