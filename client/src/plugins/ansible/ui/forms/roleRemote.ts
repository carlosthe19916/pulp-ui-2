import {
  authSection,
  connectionSections,
  nameField,
  urlField,
} from "@app/forms/fragments";
import { remoteForm } from "@plugin-sdk/ui";

import { ansible } from "../../definition";

/** An Ansible role remote syncs roles from a Galaxy v1 roles endpoint. */
export const ansibleRoleRemoteForm = remoteForm(ansible.remote["ansible.role"])(
  ({ f, s }) => ({
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
  }),
);
