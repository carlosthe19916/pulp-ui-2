import {
  authSection,
  connectionSections,
  nameField,
  urlField,
} from "@app/forms/fragments";
import { remoteForm } from "@plugin-sdk/ui";

import { maven } from "../../definition";

/** A Maven remote proxies a Maven repository; artifacts are cached as clients ask. */
export const mavenRemoteForm = remoteForm(maven.remote["maven.maven"])(
  ({ f, s }) => ({
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
  }),
);
