import type { FormRegistry } from "../registry";
import { debAptPublicationForm, debVerbatimPublicationForm } from "./deb";
import {
  filePublicationForm,
  gemPublicationForm,
  huggingFacePublicationForm,
  pypiPublicationForm,
  rpmPublicationForm,
} from "./publications";

// Publications are immutable: create only.
const CREATE = ["create"] as const;

/** Publication forms by pulp_type. */
export const PUBLICATION_FORMS: FormRegistry = {
  "file.file": { label: "File", form: filePublicationForm, modes: [...CREATE] },
  "rpm.rpm": { label: "RPM", form: rpmPublicationForm, modes: [...CREATE] },
  "python.pypi": {
    label: "PyPI",
    form: pypiPublicationForm,
    modes: [...CREATE],
  },
  "gem.gem": { label: "Gem", form: gemPublicationForm, modes: [...CREATE] },
  "hugging_face.hugging-face": {
    label: "Hugging Face",
    form: huggingFacePublicationForm,
    modes: [...CREATE],
  },
  "deb.apt-publication": {
    label: "APT",
    form: debAptPublicationForm,
    modes: [...CREATE],
  },
  "deb.verbatim-publication": {
    label: "APT (verbatim)",
    form: debVerbatimPublicationForm,
    modes: [...CREATE],
  },
};
