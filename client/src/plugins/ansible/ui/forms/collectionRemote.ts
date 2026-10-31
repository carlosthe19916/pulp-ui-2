import type { IFormContext } from "@app/plugin-forms";
import {
  authSection,
  connectionSections,
  nameField,
  SECTION_IDS,
  urlField,
} from "@app/plugin-forms/fragments";
import { remoteForm } from "@plugin-sdk/ui";

import { ansible } from "../../definition";
import { isPublicGalaxyUrl } from "./galaxy";

const REQUIREMENTS_TEMPLATE = `---
collections:
  - name: ansible.posix
    version: ">=1.5.0"
  - name: community.general
`;

const isPublicGalaxy = ({ values }: IFormContext): boolean =>
  typeof values.url === "string" && isPublicGalaxyUrl(values.url);

const hasRequirements = ({ values }: IFormContext): boolean =>
  typeof values.requirements_file === "string" &&
  values.requirements_file.trim() !== "";

/**
 * An Ansible collection remote syncs from Galaxy or Automation Hub. What it syncs comes
 * from its requirements file, so that leads the form.
 */
export const ansibleCollectionRemoteForm = remoteForm(
  ansible.remote["ansible.collection"],
)(({ f, s }) => ({
  title: {
    create: "Create Ansible collection remote",
    edit: "Edit Ansible collection remote",
  },
  docsUrl: "https://pulpproject.org/pulp_ansible/",
  sections: [
    s.essentials([
      nameField(f),
      urlField(f, {
        help: "The Galaxy API root to sync from, e.g. https://galaxy.ansible.com/api/.",
      }),
      f.code("requirements_file", {
        label: "Requirements",
        language: "yaml",
        template: REQUIREMENTS_TEMPLATE,
        downloadName: "requirements",
        help: "A requirements.yml listing the collections (and versions) to sync. Without one, the remote syncs everything the server offers.",
        warnings: [
          {
            when: (ctx) => isPublicGalaxy(ctx) && !hasRequirements(ctx),
            message:
              "Without requirements, a sync from galaxy.ansible.com downloads every collection on Galaxy.",
          },
        ],
      }),
      f.row([
        f.switch("sync_dependencies", {
          label: "Sync dependencies",
          defaultValue: true,
          help: "Also sync the collections the listed ones depend on.",
        }),
        f.switch("signed_only", {
          label: "Signed collections only",
          help: "Skip collection versions that have no signature.",
        }),
      ]),
    ]),
    s.collapsible(
      SECTION_IDS.auth,
      "Authentication",
      [
        f.secret("token", {
          label: "Token",
          help: "The API token, e.g. an Automation Hub offline token.",
        }),
        f.url("auth_url", {
          label: "SSO URL",
          help: "Where the token is exchanged for a session token (Automation Hub). Leave empty for Galaxy.",
        }),
        ...authSection(f),
      ],
      { description: "Galaxy needs none; Automation Hub needs a token." },
    ),
    s.collapsible("versions", "Version selection", [
      f.number("sync_highest_versions", {
        label: "Highest versions to sync",
        help: "How many of the newest versions of each collection to sync. Empty syncs all versions.",
      }),
    ]),
    ...connectionSections({ f, s }),
  ],
  // Collection remotes accept only the "immediate" policy, the server default.
  omit: ["policy"],
}));
