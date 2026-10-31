import {
  labelsSection,
  remoteField,
  repositoryIdentity,
  retentionSection,
} from "@app/forms/fragments";
import { repositoryForm } from "@plugin-sdk/ui";

import { maven } from "../../definition";

/** A Maven repository adds no settings of its own: identity, remote, retention and labels. */
export const mavenRepositoryForm = repositoryForm(
  maven.repository["maven.maven"],
)(({ f, s }) => ({
  title: { create: "Create Maven repository", edit: "Edit Maven repository" },
  docsUrl: "https://pulpproject.org/pulp_maven/",
  sections: [
    s.essentials([...repositoryIdentity(f), remoteField(f)]),
    retentionSection({ f, s }),
    labelsSection({ f, s }),
  ],
}));
