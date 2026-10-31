import type { RepositoriesPythonPythonCreateData } from "@app/client";

import {
  labelsSection,
  remoteField,
  repositoryIdentity,
  retentionSection,
} from "../fragments/repository";
import { defineForm } from "../kit/defineForm";

/** A Python repository and how it treats uploads that clash with packages it holds. */
export const pythonRepositoryForm = defineForm<
  RepositoriesPythonPythonCreateData["body"]
>()(({ f, s }) => ({
  title: {
    create: "Create Python repository",
    edit: "Edit Python repository",
  },
  docsUrl: "https://pulpproject.org/pulp_python/",
  sections: [
    s.essentials([...repositoryIdentity(f), remoteField(f)]),
    s.collapsible("packages", "Package policy", [
      f.switch("allow_package_substitution", {
        label: "Allow package substitution",
        defaultValue: true,
        help: "Accept a package with the same filename as one held but a different checksum.",
      }),
      f.switch("error_on_reject", {
        label: "Fail the version when a package is rejected",
        defaultValue: true,
        help: "Off: rejected packages are skipped and the rest are added.",
      }),
    ]),
    retentionSection({ f, s }),
    labelsSection({ f, s }),
  ],
  // Deprecated: distributions serve the repository directly.
  omit: ["autopublish"],
}));
