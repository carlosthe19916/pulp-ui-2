import type { RemotesAnsibleRoleCreateData } from "@app/client";

import { nameField, urlField } from "../fragments/base";
import { authSection, connectionSections } from "../fragments/remoteNetwork";
import { defineForm } from "../kit/defineForm";

/** An Ansible role remote syncs roles from a Galaxy v1 roles endpoint. */
export const ansibleRoleRemoteForm = defineForm<
  RemotesAnsibleRoleCreateData["body"]
>()(({ f, s }) => ({
  title: {
    create: "Create Ansible role remote",
    edit: "Edit Ansible role remote",
  },
  docsUrl: "https://pulpproject.org/pulp_ansible/",
  sections: [
    s.essentials([
      nameField(f),
      urlField(f, {
        help: "A Galaxy roles URL, optionally filtered, e.g. https://galaxy.ansible.com/api/v1/roles/?namespace__name=elastic.",
      }),
    ]),
    s.collapsible("auth", "Authentication", authSection(f)),
    ...connectionSections({ f, s }),
  ],
  // Role remotes accept only the "immediate" policy, the server default.
  omit: ["policy"],
}));
