import type { FormRegistry } from "../registry";
import { ansibleCollectionRemoteForm } from "./ansibleCollection";
import { fileRemoteForm } from "./file";

/** Remote forms by pulp_type. */
export const REMOTE_FORMS: FormRegistry = {
  "file.file": {
    label: "File",
    form: fileRemoteForm,
    modes: ["create", "edit"],
  },
  "ansible.collection": {
    label: "Ansible collection",
    form: ansibleCollectionRemoteForm,
    modes: ["create", "edit"],
  },
};
