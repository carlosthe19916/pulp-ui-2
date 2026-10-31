import { definePluginUi, GENERIC, lazyViews } from "@plugin-sdk/ui";

import { ansible } from "../definition";
import { ansibleActions } from "./actions";
import { ansibleCollectionRemoteForm } from "./forms/collectionRemote";
import { ansibleDistributionForm } from "./forms/distribution";
import { ansibleGitRemoteForm } from "./forms/gitRemote";
import { ansibleRepositoryForm } from "./forms/repository";
import { ansibleRoleRemoteForm } from "./forms/roleRemote";

const ansibleBrowse = lazyViews(() => import("./browse/AnsibleBrowse"));
const ansibleContent = lazyViews(() => import("./content/AnsibleContent"));

export const ansibleUi = definePluginUi({
  definition: ansible,
  ui: {
    label: "Ansible",
    pages: [
      {
        label: "Ansible Collections",
        to: "/content-management/$pulpDomain/ansible-collections",
        Page: lazyViews(() => import("./pages/AnsibleCollectionList"))(
          "AnsibleCollectionList",
        ),
      },
    ],
    remote: {
      "ansible.collection": {
        label: "Ansible collection",
        form: ansibleCollectionRemoteForm,
      },
      "ansible.role": { label: "Ansible role", form: ansibleRoleRemoteForm },
      "ansible.git": { label: "Ansible (Git)", form: ansibleGitRemoteForm },
    },
    repository: {
      "ansible.ansible": {
        form: ansibleRepositoryForm,
        browse: {
          sections: [
            {
              key: "collections",
              title: "Collections",
              pulpTypes: ["ansible.collection_version"],
              View: ansibleBrowse("AnsibleCollections"),
            },
            {
              key: "deprecations",
              title: "Deprecated",
              pulpTypes: ["ansible.collection_deprecation"],
              View: ansibleBrowse("AnsibleDeprecations"),
            },
            {
              key: "namespaces",
              title: "Namespaces",
              pulpTypes: ["ansible.namespace"],
              View: ansibleBrowse("AnsibleNamespaces"),
            },
            {
              key: "roles",
              title: "Roles",
              pulpTypes: ["ansible.role"],
              View: ansibleBrowse("AnsibleRoles"),
            },
          ],
        },
        tab: null,
        actions: ansibleActions,
      },
    },
    distribution: {
      "ansible.ansible": {
        form: ansibleDistributionForm,
        clientSetup: ({ name, clientUrl }) =>
          clientUrl
            ? {
                hint: "Add a Galaxy server to ansible.cfg.",
                code: `[galaxy]\nserver_list = ${name}\n\n[galaxy_server.${name}]\nurl = ${clientUrl}\ntoken = <put your token here>`,
              }
            : null,
      },
    },
    content: {
      "ansible.collection_version": {
        panel: ansibleContent("AnsibleContent"),
        search: { param: "name", label: "name" },
        upload: [
          {
            key: "expected_namespace",
            label: "Expected namespace",
            type: "text",
          },
          { key: "expected_name", label: "Expected name", type: "text" },
          { key: "expected_version", label: "Expected version", type: "text" },
        ],
      },
      "ansible.collection_deprecation": { panel: GENERIC, search: null },
      "ansible.collection_mark": { panel: GENERIC, search: null },
      "ansible.collection_signature": {
        panel: GENERIC,
        search: null,
        upload: [
          {
            key: "signed_collection",
            label: "Signed collection href",
            type: "text",
            required: true,
            helpText:
              "The pulp_href of the collection version this signature signs.",
          },
        ],
      },
      "ansible.namespace": {
        panel: lazyViews(() => import("./content/AnsibleNamespaceContent"))(
          "AnsibleNamespaceContent",
        ),
        search: null,
      },
      "ansible.role": {
        panel: lazyViews(() => import("./content/AnsibleRoleContent"))(
          "AnsibleRoleContent",
        ),
        search: null,
      },
    },
  },
});
