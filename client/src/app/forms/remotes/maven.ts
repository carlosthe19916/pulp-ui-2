import type { RemotesMavenMavenCreateData } from "@app/client";

import { nameField, urlField } from "../fragments/base";
import { authSection, connectionSections } from "../fragments/remoteNetwork";
import { defineForm } from "../kit/defineForm";

/** A Maven remote proxies a Maven repository; artifacts are cached as clients ask. */
export const mavenRemoteForm = defineForm<
  RemotesMavenMavenCreateData["body"]
>()(({ f, s }) => ({
  title: { create: "Create Maven remote", edit: "Edit Maven remote" },
  docsUrl: "https://pulpproject.org/pulp_maven/",
  sections: [
    s.essentials([
      nameField(f),
      urlField(f, {
        help: "The Maven repository, e.g. https://repo1.maven.org/maven2/.",
      }),
    ]),
    s.collapsible("auth", "Authentication", authSection(f)),
    ...connectionSections({ f, s }),
  ],
  // Maven remotes accept only the "immediate" policy, the server default.
  omit: ["policy"],
}));
