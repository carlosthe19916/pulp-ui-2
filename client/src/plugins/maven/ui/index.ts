import { relativePathField } from "@app/utils/entityFieldPresets";
import { definePluginUi, GENERIC, lazyViews } from "@plugin-sdk/ui";

import { maven } from "../definition";
import { mavenActions } from "./actions";
import { mavenDistributionForm } from "./forms/distribution";
import { mavenRemoteForm } from "./forms/remote";
import { mavenRepositoryForm } from "./forms/repository";

const mavenBrowse = lazyViews(() => import("./browse/MavenBrowse"));
const mavenPathIndexTab = lazyViews(() => import("./tabs/MavenPathIndexTab"));
const mavenContent = lazyViews(() => import("./content/MavenContent"));
const mavenPackageContent = lazyViews(
  () => import("./content/MavenPackageContent"),
);

export const mavenUi = definePluginUi({
  definition: maven,
  ui: {
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
              View: mavenBrowse("MavenArtifacts"),
            },
          ],
        },
        tab: {
          key: "path-index",
          title: "Path index",
          Tab: mavenPathIndexTab("MavenPathIndexTab"),
        },
        actions: mavenActions,
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
        panel: mavenContent("MavenContent"),
        search: null,
        upload: [relativePathField({ required: true })],
      },
      "maven.metadata": {
        panel: GENERIC,
        search: null,
        upload: [relativePathField({ required: true })],
      },
      "maven.package": {
        panel: mavenPackageContent("MavenPackageContent"),
        search: null,
      },
      "maven.index-page": { panel: GENERIC, search: null },
    },
  },
});
