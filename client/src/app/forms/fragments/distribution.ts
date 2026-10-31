import type { IFieldBuilders, ISectionBuilders } from "../kit/defineForm";
import { makeRepositoryVersionField } from "../kit/fields/RepositoryVersionField";
import type { IChoiceOption, IFormContext } from "../kit/types";
import { nameField } from "./base";
import { labelsField } from "./labels";

/**
 * Distribution settings shared by pulpcore's DistributionSerializer. A distribution serves one
 * source; the UI-only `$source` choice shows that source's picker, and an edit that switches
 * source clears the old one (a hidden field that was set is sent empty).
 */

export type DistributionSource =
  "repository" | "repository_version" | "publication";

const SOURCE_OPTIONS: Record<DistributionSource, IChoiceOption> = {
  repository: {
    value: "repository",
    label: "Repository",
    description:
      "Serve the repository's latest version, following new versions.",
  },
  repository_version: {
    value: "repository_version",
    label: "Repository version",
    description: "Serve one fixed version.",
  },
  publication: {
    value: "publication",
    label: "Publication",
    description: "Serve a published snapshot.",
  },
};

const sourceOf = (entity: Record<string, unknown>): DistributionSource =>
  entity.publication
    ? "publication"
    : entity.repository_version
      ? "repository_version"
      : "repository";

const serves =
  (source: DistributionSource) =>
  ({ values }: IFormContext): boolean =>
    values.$source === source;

export const distributionIdentity = <
  T extends { name?: unknown; base_path?: unknown },
>(
  f: IFieldBuilders<T>,
) => [
  nameField(f),
  f.text("base_path", {
    label: "Base path",
    required: true,
    placeholder: "files/stable",
    help: "Where clients find the content, relative to the content app's root.",
    validate: (schema) =>
      schema.test(
        "slashes",
        "Base path can't start or end with a slash",
        (value: unknown) =>
          typeof value !== "string" || !/^\/|\/$/.test(value.trim()),
      ),
  }),
];

/** The radio choosing what the distribution serves; offer only the sources the type has. */
export const sourceChoice = <T>(
  f: IFieldBuilders<T>,
  sources: [DistributionSource, ...DistributionSource[]],
) =>
  f.select("$source", {
    kind: "radio",
    label: "Serve",
    defaultValue: sources[0],
    fromEntity: sourceOf,
    // A UI-only key has no API type to check options against.
    options: sources.map(
      (source) => SOURCE_OPTIONS[source],
    ) as unknown as IChoiceOption<never>[],
  });

export const servedRepositoryField = <T extends { repository?: unknown }>(
  f: IFieldBuilders<T>,
  { pulpTypes }: { pulpTypes: string[] },
) =>
  f.resource("repository", {
    label: "Repository",
    resourceKind: "repository",
    pulpTypes,
    visibleWhen: serves("repository"),
  });

export const servedVersionField = <T extends { repository_version?: unknown }>(
  f: IFieldBuilders<T>,
  { pulpTypes }: { pulpTypes: string[] },
) =>
  f.custom("repository_version", {
    label: "Repository version",
    component: makeRepositoryVersionField({ pulpTypes }),
    visibleWhen: serves("repository_version"),
  });

export const servedPublicationField = <T extends { publication?: unknown }>(
  f: IFieldBuilders<T>,
  { pulpTypes }: { pulpTypes: string[] },
) =>
  f.resource("publication", {
    label: "Publication",
    resourceKind: "publication",
    pulpTypes,
    visibleWhen: serves("publication"),
  });

/** A remote content is pulled through and cached from when the distribution lacks it. */
export const pullThroughRemoteField = <T extends { remote?: unknown }>(
  f: IFieldBuilders<T>,
  { pulpTypes }: { pulpTypes: string[] },
) =>
  f.resource("remote", {
    label: "Pull-through remote",
    resourceKind: "remote",
    pulpTypes,
    help: "Content the distribution doesn't hold is fetched from this remote on request and cached.",
  });

interface IAccessKeys {
  content_guard?: unknown;
  hidden?: unknown;
}

/** Who may download, and whether the distribution is listed. */
export const accessSection = <T extends IAccessKeys>({
  f,
  s,
}: {
  f: IFieldBuilders<T>;
  s: ISectionBuilders;
}) =>
  s.collapsible("access", "Access", [
    f.resource("content_guard", {
      label: "Content guard",
      resourceKind: "contentGuard",
      help: "Restricts who can download the served content.",
    }),
    f.switch("hidden", {
      label: "Hidden",
      help: "Leave the distribution out of the content app's listing.",
    }),
  ]);

export const distributionLabelsSection = <T extends { pulp_labels?: unknown }>({
  f,
  s,
}: {
  f: IFieldBuilders<T>;
  s: ISectionBuilders;
}) => s.collapsible("labels", "Labels", [labelsField(f)]);
