import type { RemotesAnsibleCollectionCreateData } from "@app/client";

import { nameField, urlField } from "../fragments/base";
import { authSection, connectionSections } from "../fragments/remoteNetwork";
import { defineForm } from "../kit/defineForm";
import type { IFormContext } from "../kit/types";

const REQUIREMENTS_TEMPLATE = `---
collections:
  - name: ansible.posix
    version: ">=1.5.0"
  - name: community.general
`;

const isPublicGalaxy = ({ values }: IFormContext): boolean =>
  typeof values.url === "string" && /galaxy\.ansible\.com/i.test(values.url);

const hasRequirements = ({ values }: IFormContext): boolean =>
  typeof values.requirements_file === "string" &&
  values.requirements_file.trim() !== "";

/**
 * An Ansible collection remote syncs from Galaxy or Automation Hub. What it syncs comes
 * from its requirements file, so that leads the form.
 */
export const ansibleCollectionRemoteForm = defineForm<
  RemotesAnsibleCollectionCreateData["body"]
>()(({ f, s }) => ({
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
      "auth",
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
