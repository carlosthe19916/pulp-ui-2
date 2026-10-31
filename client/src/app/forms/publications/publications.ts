import type {
  PublicationsFileFileCreateData,
  PublicationsGemGemCreateData,
  PublicationsHuggingFaceHuggingFaceCreateData,
  PublicationsPythonPypiCreateData,
  PublicationsRpmRpmCreateData,
} from "@app/client";

import { publicationSourceFields } from "../fragments/publication";
import { defineForm } from "../kit/defineForm";

const CHECKPOINT = {
  label: "Checkpoint",
  help: "Keep this publication as a dated checkpoint that checkpoint distributions serve.",
};

export const filePublicationForm = defineForm<
  PublicationsFileFileCreateData["body"]
>()(({ f, s }) => ({
  title: { create: "Create file publication", edit: "File publication" },
  docsUrl: "https://pulpproject.org/pulp_file/",
  sections: [
    s.essentials([
      ...publicationSourceFields(f, { pulpTypes: ["file.file"] }),
      f.switch("checkpoint", CHECKPOINT),
    ]),
    s.collapsible("publishing", "Publishing", [
      f.text("manifest", {
        label: "Manifest file name",
        defaultValue: "PULP_MANIFEST",
        help: "The name of the file listing every published file.",
      }),
    ]),
  ],
}));

export const rpmPublicationForm = defineForm<
  PublicationsRpmRpmCreateData["body"]
>()(({ f, s }) => ({
  title: { create: "Create RPM publication", edit: "RPM publication" },
  docsUrl: "https://pulpproject.org/pulp_rpm/",
  sections: [
    s.essentials([
      ...publicationSourceFields(f, { pulpTypes: ["rpm.rpm"] }),
      f.switch("checkpoint", CHECKPOINT),
    ]),
    s.collapsible(
      "publishing",
      "Publishing",
      [
        f.row([
          f.select("checksum_type", {
            label: "Checksum type",
            options: [
              { value: "sha256", label: "SHA-256" },
              { value: "sha384", label: "SHA-384" },
              { value: "sha512", label: "SHA-512" },
              { value: "sha224", label: "SHA-224" },
              { value: "sha1", label: "SHA-1" },
            ],
          }),
          f.select("compression_type", {
            label: "Metadata compression",
            options: [
              { value: "zstd", label: "zstd" },
              { value: "gz", label: "gzip" },
              { value: "none", label: "None" },
            ],
          }),
          f.select("layout", {
            label: "Package layout",
            options: [
              {
                value: "nested_alphabetically",
                label: "Nested alphabetically",
              },
              { value: "nested_by_digest", label: "Nested by digest" },
              { value: "flat", label: "Flat" },
            ],
          }),
        ]),
        f.code("repo_config", {
          label: "Client repo config",
          language: "json",
          help: 'Options for the .repo file Pulp generates for clients, e.g. {"gpgcheck": 1}.',
        }),
      ],
      { description: "Empty settings use the repository's." },
    ),
  ],
}));

export const pypiPublicationForm = defineForm<
  PublicationsPythonPypiCreateData["body"]
>()(({ f, s }) => ({
  title: { create: "Create PyPI publication", edit: "PyPI publication" },
  docsUrl: "https://pulpproject.org/pulp_python/",
  sections: [
    s.essentials(publicationSourceFields(f, { pulpTypes: ["python.python"] })),
  ],
}));

export const gemPublicationForm = defineForm<
  PublicationsGemGemCreateData["body"]
>()(({ f, s }) => ({
  title: { create: "Create gem publication", edit: "Gem publication" },
  docsUrl: "https://pulpproject.org/pulp_gem/",
  sections: [
    s.essentials(publicationSourceFields(f, { pulpTypes: ["gem.gem"] })),
  ],
}));

export const huggingFacePublicationForm = defineForm<
  PublicationsHuggingFaceHuggingFaceCreateData["body"]
>()(({ f, s }) => ({
  title: {
    create: "Create Hugging Face publication",
    edit: "Hugging Face publication",
  },
  docsUrl: "https://pulpproject.org/pulp_hugging_face/",
  sections: [
    s.essentials(
      publicationSourceFields(f, { pulpTypes: ["hugging_face.hugging-face"] }),
    ),
  ],
}));
