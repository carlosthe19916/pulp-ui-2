import type { RemotesContainerContainerCreateData } from "@app/client";

import { nameField, urlField } from "../fragments/base";
import {
  authSection,
  connectionSections,
  POLICY_OPTIONS,
  policyField,
} from "../fragments/remoteNetwork";
import { defineForm } from "../kit/defineForm";

/**
 * A container remote mirrors one image repository of a registry: which one (upstream name)
 * and which tags matter most.
 */
export const containerRemoteForm = defineForm<
  RemotesContainerContainerCreateData["body"]
>()(({ f, s }) => ({
  title: {
    create: "Create container remote",
    edit: "Edit container remote",
  },
  docsUrl: "https://pulpproject.org/pulp_container/",
  sections: [
    s.essentials([
      nameField(f),
      urlField(f, {
        help: "The registry to sync from, e.g. https://registry-1.docker.io.",
      }),
      f.text("upstream_name", {
        label: "Upstream name",
        required: true,
        placeholder: "library/busybox",
        help: "The repository in the registry to mirror.",
      }),
      f.row([
        f.stringList("includes", {
          label: "Include tags",
          help: "Tags or digests (sha256:…) to sync; * and ? are wildcards. Empty syncs every tag.",
        }),
        f.stringList("excludes", {
          label: "Exclude tags",
          help: "Tag patterns to skip, applied after the includes.",
        }),
      ]),
      policyField(f, [
        POLICY_OPTIONS.immediate,
        POLICY_OPTIONS.on_demand,
        POLICY_OPTIONS.streamed,
      ]),
    ]),
    s.collapsible("auth", "Authentication", authSection(f)),
    s.collapsible("signatures", "Signatures", [
      f.url("sigstore", {
        label: "Sigstore URL",
        help: "Where to download image signatures from.",
      }),
    ]),
    ...connectionSections({ f, s }),
  ],
  // Deprecated in favour of `includes` and `excludes`.
  omit: ["include_tags", "exclude_tags"],
}));
