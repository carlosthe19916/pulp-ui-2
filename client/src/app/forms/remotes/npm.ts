import type { RemotesNpmNpmCreateData } from "@app/client";

import { nameField, urlField } from "../fragments/base";
import {
  authSection,
  connectionSections,
  POLICY_OPTIONS,
  policyField,
} from "../fragments/remoteNetwork";
import { defineForm } from "../kit/defineForm";

/** An npm remote syncs one package from an npm registry. */
export const npmRemoteForm = defineForm<RemotesNpmNpmCreateData["body"]>()(
  ({ f, s }) => ({
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
  }),
);
