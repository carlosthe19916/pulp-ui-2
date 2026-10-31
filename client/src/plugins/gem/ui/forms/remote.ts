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

import { gem } from "../../definition";

/** A gem remote syncs from a RubyGems server. */
export const gemRemoteForm = remoteForm(gem.remote["gem.gem"])(({ f, s }) => ({
  title: { create: "Create gem remote", edit: "Edit gem remote" },
  docsUrl: "https://pulpproject.org/pulp_gem/",
  sections: [
    s.essentials([
      nameField(f),
      urlField(f, { help: "The gem server, e.g. https://rubygems.org/." }),
      policyField(f, [
        POLICY_OPTIONS.immediate,
        POLICY_OPTIONS.on_demand,
        POLICY_OPTIONS.streamed,
      ]),
    ]),
    s.collapsible("gems", "Gem selection", [
      f.keyValue("includes", {
        label: "Included gem",
        shape: "labels",
        help: "Gems to sync, each with an optional version requirement (e.g. rails → ~> 7.1). Empty syncs every gem.",
      }),
      f.keyValue("excludes", {
        label: "Excluded gem",
        shape: "labels",
        help: "Gems to skip, each with an optional version requirement.",
      }),
      f.switch("prereleases", { label: "Include pre-releases" }),
    ]),
    s.collapsible(SECTION_IDS.auth, "Authentication", authSection(f)),
    ...connectionSections({ f, s }),
  ],
}));
