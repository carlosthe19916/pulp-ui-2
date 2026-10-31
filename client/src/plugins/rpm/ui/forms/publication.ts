import { CHECKPOINT, publicationSourceFields } from "@app/forms/fragments";
import { publicationForm } from "@plugin-sdk/ui";

import { rpm } from "../../definition";

/** Publishes an RPM repository's metadata; empty settings use the repository's. */
export const rpmPublicationForm = publicationForm(rpm.publication["rpm.rpm"])(
  ({ f, s }) => ({
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
  }),
);
