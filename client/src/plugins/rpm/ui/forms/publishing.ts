import type { IChoiceOption, IFieldBuilders } from "@app/plugin-forms";

interface IPublishingKeys {
  checksum_type?: unknown;
  compression_type?: unknown;
  layout?: unknown;
  repo_config?: unknown;
}

// The option values are each body's enums; TS can't relate them across both bodies.
const options = (values: IChoiceOption[]) =>
  values as unknown as IChoiceOption<never>[];

/** How RPM metadata is published, set on a repository or overridden per publication. */
export const rpmPublishingFields = <T extends IPublishingKeys>(
  f: IFieldBuilders<T>,
) => [
  f.row([
    f.select("checksum_type", {
      label: "Checksum type",
      options: options([
        { value: "sha256", label: "SHA-256" },
        { value: "sha384", label: "SHA-384" },
        { value: "sha512", label: "SHA-512" },
        { value: "sha224", label: "SHA-224" },
        { value: "sha1", label: "SHA-1" },
      ]),
    }),
    f.select("compression_type", {
      label: "Metadata compression",
      options: options([
        { value: "zstd", label: "zstd" },
        { value: "gz", label: "gzip" },
        { value: "none", label: "None" },
      ]),
    }),
    f.select("layout", {
      label: "Package layout",
      options: options([
        { value: "nested_alphabetically", label: "Nested alphabetically" },
        { value: "nested_by_digest", label: "Nested by digest" },
        { value: "flat", label: "Flat" },
      ]),
    }),
  ]),
  f.code("repo_config", {
    label: "Client repo config",
    language: "json",
    help: 'Options for the .repo file Pulp generates for clients, e.g. {"gpgcheck": 1}.',
  }),
];
