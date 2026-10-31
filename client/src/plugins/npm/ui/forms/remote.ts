import {
  authSection,
  connectionSections,
  nameField,
  POLICY_OPTIONS,
  policyField,
  urlField,
} from "@app/forms/fragments";
import { remoteForm } from "@plugin-sdk/ui";

import { npm } from "../../definition";

/** An npm remote syncs one package from an npm registry. */
export const npmRemoteForm = remoteForm(npm.remote["npm.npm"])(({ f, s }) => ({
  title: { create: "Create npm remote", edit: "Edit npm remote" },
  docsUrl: "https://pulpproject.org/pulp_npm/",
  sections: [
    s.essentials([
      nameField(f),
      urlField(f, {
        help: "The package in the registry, e.g. https://registry.npmjs.org/commander.",
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
}));
