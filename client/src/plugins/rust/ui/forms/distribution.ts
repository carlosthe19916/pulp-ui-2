import {
  accessSection,
  distributionIdentity,
  distributionLabelsSection,
  pullThroughRemoteField,
  servedRepositoryField,
  servedVersionField,
  sourceChoice,
} from "@app/plugin-forms/fragments";
import { distributionForm } from "@plugin-sdk/ui";

import { rust } from "../../definition";

/**
 * A Cargo registry: serves a repository or version, and either accepts `cargo publish` or
 * pulls crates through a remote (Pulp refuses both on one repository).
 */
export const rustDistributionForm = distributionForm(
  rust.distribution["rust.rust"],
)(({ f, s }) => ({
  title: { create: "Create Rust distribution", edit: "Edit Rust distribution" },
  docsUrl: "https://pulpproject.org/pulp_rust/",
  sections: [
    s.essentials([
      ...distributionIdentity(f),
      sourceChoice(f, ["repository", "repository_version"]),
      servedRepositoryField(f, { pulpTypes: ["rust.rust"] }),
      servedVersionField(f, { pulpTypes: ["rust.rust"] }),
      f.switch("allow_uploads", {
        label: "Allow uploads",
        help: "Let clients publish and yank crates (cargo publish, cargo yank).",
      }),
    ]),
    s.collapsible("pull-through", "Pull-through caching", [
      pullThroughRemoteField(f, { pulpTypes: ["rust.rust"] }),
    ]),
    accessSection({ f, s }),
    distributionLabelsSection({ f, s }),
  ],
}));
