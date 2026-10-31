import {
  accessSection,
  distributionIdentity,
  distributionLabelsSection,
  pullThroughRemoteField,
  servedPublicationField,
  servedRepositoryField,
  servedVersionField,
  sourceChoice,
} from "@app/forms/fragments";
import { distributionForm } from "@plugin-sdk/ui";

import { python } from "../../definition";

/** A PyPI index: serves a repository or publication, and can pull packages through a remote. */
export const pypiDistributionForm = distributionForm(
  python.distribution["python.pypi"],
)(({ f, s }) => ({
  title: { create: "Create PyPI distribution", edit: "Edit PyPI distribution" },
  docsUrl: "https://pulpproject.org/pulp_python/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      sourceChoice(f, ["repository", "publication", "repository_version"]),
      servedRepositoryField(f, { pulpTypes: ["python.python"] }),
      servedPublicationField(f, { pulpTypes: ["python.pypi"] }),
      servedVersionField(f, { pulpTypes: ["python.python"] }),
      f.switch("allow_uploads", {
        label: "Allow uploads",
        defaultValue: true,
        help: "Let clients upload packages to this index (twine upload).",
      }),
    ]),
    s.collapsible("pull-through", "Pull-through caching", [
      pullThroughRemoteField(f, { pulpTypes: ["python.python"] }),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));
