import type { FormRegistry } from "../registry";
import { ansibleRepositoryForm } from "./ansible";
import {
  containerPushRepositoryForm,
  containerRepositoryForm,
} from "./container";
import { debRepositoryForm } from "./deb";
import { fileRepositoryForm } from "./file";
import { openpgpKeyringRepositoryForm } from "./openpgpKeyring";
import { ostreeRepositoryForm } from "./ostree";
import { pythonRepositoryForm } from "./python";
import { rpmRepositoryForm } from "./rpm";
import {
  gemRepositoryForm,
  huggingFaceRepositoryForm,
  mavenRepositoryForm,
  npmRepositoryForm,
} from "./simple";

const BOTH = ["create", "edit"] as const;

/** Repository forms by pulp_type. */
export const REPOSITORY_FORMS: FormRegistry = {
  "file.file": { label: "File", form: fileRepositoryForm, modes: [...BOTH] },
  "rpm.rpm": { label: "RPM", form: rpmRepositoryForm, modes: [...BOTH] },
  "python.python": {
    label: "Python",
    form: pythonRepositoryForm,
    modes: [...BOTH],
  },
  "container.container": {
    label: "Container",
    form: containerRepositoryForm,
    modes: [...BOTH],
  },
  // Created only by pushing an image to the registry.
  "container.container-push": {
    label: "Container (push)",
    form: containerPushRepositoryForm,
    modes: ["edit"],
  },
  "gem.gem": { label: "Gem", form: gemRepositoryForm, modes: [...BOTH] },
  "npm.npm": { label: "npm", form: npmRepositoryForm, modes: [...BOTH] },
  "maven.maven": {
    label: "Maven",
    form: mavenRepositoryForm,
    modes: [...BOTH],
  },
  "hugging_face.hugging-face": {
    label: "Hugging Face",
    form: huggingFaceRepositoryForm,
    modes: [...BOTH],
  },
  "ostree.ostree": {
    label: "OSTree",
    form: ostreeRepositoryForm,
    modes: [...BOTH],
  },
  "deb.deb": { label: "APT", form: debRepositoryForm, modes: [...BOTH] },
  "ansible.ansible": {
    label: "Ansible",
    form: ansibleRepositoryForm,
    modes: [...BOTH],
  },
  "core.openpgp": {
    label: "OpenPGP keyring",
    form: openpgpKeyringRepositoryForm,
    modes: [...BOTH],
  },
};
