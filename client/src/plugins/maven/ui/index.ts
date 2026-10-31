import { relativePathField } from "@app/utils/entityField";
import { definePluginUi, GENERIC, lazyView } from "@plugin-sdk/ui";

import { maven } from "../definition";
import { mavenDistributionForm } from "./forms/distribution";
import { mavenRemoteForm } from "./forms/remote";
import { mavenRepositoryForm } from "./forms/repository";

export const mavenUi = definePluginUi(maven, {
  label: "Maven",
  remote: { "maven.maven": { form: mavenRemoteForm } },
  repository: {
    "maven.maven": {
      form: mavenRepositoryForm,
      browse: {
        sections: [
          {
            key: "artifacts",
            title: "Artifacts",
            pulpTypes: ["maven.package", "maven.artifact"],
            View: lazyView({
              load: () => import("./browse/MavenBrowse"),
              name: "MavenArtifacts",
            }),
          },
        ],
      },
      tab: {
        key: "path-index",
        title: "Path index",
        Tab: lazyView({
          load: () => import("./tabs/MavenPathIndexTab"),
          name: "MavenPathIndexTab",
        }),
      },
      actions: {
        "repair-metadata": {
          label: "Repair metadata",
          description:
            "Regenerates every maven-metadata.xml file and its checksums.",
          fields: [],
        },
        "repair-packages": {
          label: "Repair packages",
          description:
            "Reconciles the latest version's packages with the POMs it holds.",
          fields: [],
        },
        "repair-index-pages": {
          label: "Repair index pages",
          description: "Regenerates the HTML index page of every directory.",
          fields: [],
        },
        "build-path-index": {
          label: "Build path index",
          description: "Builds the initial path index.",
          fields: [],
        },
        "compact-path-index": {
          label: "Compact path index",
          description: "Rebases the latest completed path index.",
          fields: [],
        },
      },
    },
  },
  distribution: {
    "maven.maven": {
      form: mavenDistributionForm,
      clientSetup: ({ name, baseUrl }) => ({
        hint: "Add to the <repositories> section of pom.xml or settings.xml.",
        code: `<repository>\n  <id>${name}</id>\n  <url>${baseUrl}</url>\n</repository>`,
      }),
    },
  },
  content: {
    "maven.artifact": {
      panel: lazyView({
        load: () => import("./content/MavenContent"),
        name: "MavenContent",
      }),
      search: null,
      upload: [relativePathField({ required: true })],
    },
    "maven.metadata": {
      panel: GENERIC,
      search: null,
      upload: [relativePathField({ required: true })],
    },
    "maven.package": {
      panel: lazyView({
        load: () => import("./content/MavenPackageContent"),
        name: "MavenPackageContent",
      }),
      search: null,
    },
    "maven.index-page": { panel: GENERIC, search: null },
  },
});
