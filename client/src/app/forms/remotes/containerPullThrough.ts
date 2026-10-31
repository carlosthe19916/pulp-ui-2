import type { RemotesContainerPullThroughCreateData } from "@app/client";

import { nameField, urlField } from "../fragments/base";
import { authSection, connectionSections } from "../fragments/remoteNetwork";
import { defineForm } from "../kit/defineForm";

/** A pull-through remote caches images from a registry as clients pull them. */
export const containerPullThroughRemoteForm = defineForm<
  RemotesContainerPullThroughCreateData["body"]
>()(({ f, s }) => ({
  title: {
    create: "Create container pull-through remote",
    edit: "Edit container pull-through remote",
  },
  docsUrl: "https://pulpproject.org/pulp_container/",
  sections: [
    s.essentials([
      nameField(f),
      urlField(f, {
        help: "The registry to cache from, e.g. https://registry-1.docker.io.",
      }),
      f.row([
        f.stringList("includes", {
          label: "Include repositories",
          help: "Upstream repositories that may be cached; * and ? are wildcards. Empty allows all.",
        }),
        f.stringList("excludes", {
          label: "Exclude repositories",
          help: "Upstream repositories that may not be cached, applied after the includes.",
        }),
      ]),
    ]),
    s.collapsible("auth", "Authentication", authSection(f)),
    ...connectionSections({ f, s }),
  ],
  // Pull-through caching is always "on_demand", the server default.
  omit: ["policy"],
}));
