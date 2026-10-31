import type { FormRegistry } from "../registry";
import { ansibleCollectionRemoteForm } from "./ansibleCollection";
import { ansibleGitRemoteForm } from "./ansibleGit";
import { ansibleRoleRemoteForm } from "./ansibleRole";
import { containerRemoteForm } from "./container";
import { containerPullThroughRemoteForm } from "./containerPullThrough";
import { debRemoteForm } from "./deb";
import { fileRemoteForm } from "./file";
import { fileGitRemoteForm } from "./fileGit";
import { gemRemoteForm } from "./gem";
import { huggingFaceRemoteForm } from "./huggingFace";
import { mavenRemoteForm } from "./maven";
import { npmRemoteForm } from "./npm";
import { ostreeRemoteForm } from "./ostree";
import { pythonRemoteForm } from "./python";
import { rpmRemoteForm } from "./rpm";
import { rpmUlnRemoteForm } from "./rpmUln";

const BOTH = ["create", "edit"] as const;

/** Remote forms by pulp_type. */
export const REMOTE_FORMS: FormRegistry = {
  "file.file": { label: "File", form: fileRemoteForm, modes: [...BOTH] },
  "file.git": {
    label: "File (Git)",
    form: fileGitRemoteForm,
    modes: [...BOTH],
  },
  "rpm.rpm": { label: "RPM", form: rpmRemoteForm, modes: [...BOTH] },
  "rpm.uln": { label: "RPM (ULN)", form: rpmUlnRemoteForm, modes: [...BOTH] },
  "python.python": {
    label: "Python",
    form: pythonRemoteForm,
    modes: [...BOTH],
  },
  "container.container": {
    label: "Container",
    form: containerRemoteForm,
    modes: [...BOTH],
  },
  "container.pull-through": {
    label: "Container (pull-through)",
    form: containerPullThroughRemoteForm,
    modes: [...BOTH],
  },
  "gem.gem": { label: "Gem", form: gemRemoteForm, modes: [...BOTH] },
  "npm.npm": { label: "npm", form: npmRemoteForm, modes: [...BOTH] },
  "maven.maven": { label: "Maven", form: mavenRemoteForm, modes: [...BOTH] },
  "ostree.ostree": {
    label: "OSTree",
    form: ostreeRemoteForm,
    modes: [...BOTH],
  },
  "hugging_face.hugging-face": {
    label: "Hugging Face",
    form: huggingFaceRemoteForm,
    modes: [...BOTH],
  },
  "deb.apt-remote": { label: "APT", form: debRemoteForm, modes: [...BOTH] },
  "ansible.collection": {
    label: "Ansible collection",
    form: ansibleCollectionRemoteForm,
    modes: [...BOTH],
  },
  "ansible.role": {
    label: "Ansible role",
    form: ansibleRoleRemoteForm,
    modes: [...BOTH],
  },
  "ansible.git": {
    label: "Ansible (Git)",
    form: ansibleGitRemoteForm,
    modes: [...BOTH],
  },
};
