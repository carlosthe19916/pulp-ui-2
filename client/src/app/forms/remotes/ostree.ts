import type { RemotesOstreeOstreeCreateData } from "@app/client";

import { nameField, urlField } from "../fragments/base";
import {
  authSection,
  connectionSections,
  POLICY_OPTIONS,
  policyField,
} from "../fragments/remoteNetwork";
import { defineForm } from "../kit/defineForm";

/** An OSTree remote syncs refs from an OSTree repository. */
export const ostreeRemoteForm = defineForm<
  RemotesOstreeOstreeCreateData["body"]
>()(({ f, s }) => ({
  title: { create: "Create OSTree remote", edit: "Edit OSTree remote" },
  docsUrl: "https://pulpproject.org/pulp_ostree/",
  sections: [
    s.essentials([
      nameField(f),
      urlField(f, {
        help: "The OSTree repository, e.g. https://kojipkgs.fedoraproject.org/ostree/repo/.",
      }),
      f.row([
        f.stringList("include_refs", {
          label: "Include refs",
          help: "Refs to sync; * and ? are wildcards. Empty syncs every ref.",
        }),
        f.stringList("exclude_refs", {
          label: "Exclude refs",
          help: "Refs to skip, applied after the includes.",
        }),
      ]),
      policyField(f, [POLICY_OPTIONS.immediate, POLICY_OPTIONS.on_demand]),
    ]),
    s.collapsible("history", "History", [
      f.number("depth", {
        label: "Commit depth",
        help: "How many parent commits of each ref to sync. 0 syncs only the latest.",
      }),
    ]),
    s.collapsible("auth", "Authentication", authSection(f)),
    ...connectionSections({ f, s }),
  ],
}));
