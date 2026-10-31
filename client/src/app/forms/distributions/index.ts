import type { FormRegistry } from "../registry";
import {
  containerDistributionForm,
  containerPullThroughDistributionForm,
} from "./container";
import {
  debDistributionForm,
  fileDistributionForm,
  rpmDistributionForm,
} from "./published";
import {
  gemDistributionForm,
  huggingFaceDistributionForm,
  mavenDistributionForm,
  npmDistributionForm,
  pypiDistributionForm,
} from "./pullThrough";
import {
  ansibleDistributionForm,
  openpgpDistributionForm,
  ostreeDistributionForm,
} from "./repositoryServed";

const BOTH = ["create", "edit"] as const;

/** Distribution forms by pulp_type. */
export const DISTRIBUTION_FORMS: FormRegistry = {
  "file.file": { label: "File", form: fileDistributionForm, modes: [...BOTH] },
  "rpm.rpm": { label: "RPM", form: rpmDistributionForm, modes: [...BOTH] },
  "python.pypi": {
    label: "PyPI",
    form: pypiDistributionForm,
    modes: [...BOTH],
  },
  "container.container": {
    label: "Container",
    form: containerDistributionForm,
    modes: [...BOTH],
  },
  "container.pull-through": {
    label: "Container (pull-through)",
    form: containerPullThroughDistributionForm,
    modes: [...BOTH],
  },
  "gem.gem": { label: "Gem", form: gemDistributionForm, modes: [...BOTH] },
  "npm.npm": { label: "npm", form: npmDistributionForm, modes: [...BOTH] },
  "maven.maven": {
    label: "Maven",
    form: mavenDistributionForm,
    modes: [...BOTH],
  },
  "hugging_face.hugging-face": {
    label: "Hugging Face",
    form: huggingFaceDistributionForm,
    modes: [...BOTH],
  },
  "ostree.ostree": {
    label: "OSTree",
    form: ostreeDistributionForm,
    modes: [...BOTH],
  },
  "deb.apt-distribution": {
    label: "APT",
    form: debDistributionForm,
    modes: [...BOTH],
  },
  "ansible.ansible": {
    label: "Ansible",
    form: ansibleDistributionForm,
    modes: [...BOTH],
  },
  "core.openpgp": {
    label: "OpenPGP keyring",
    form: openpgpDistributionForm,
    modes: [...BOTH],
  },
};
