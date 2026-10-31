import type { IFieldBuilders, ISectionBuilders } from "../kit/defineForm";
import { descriptionField, nameField } from "./base";
import { labelsField } from "./labels";

/**
 * Repository settings shared by pulpcore's RepositorySerializer; each plugin places them around
 * its own fields.
 */

/** Name and description, the start of every repository's General section. */
export const repositoryIdentity = <
  T extends { name?: unknown; description?: unknown },
>(
  f: IFieldBuilders<T>,
) => [nameField(f), descriptionField(f)];

/** The remote syncs come from; the picker offers only the types this repository syncs. */
export const remoteField = <T extends { remote?: unknown }>(
  f: IFieldBuilders<T>,
) =>
  f.resource("remote", {
    label: "Remote",
    resourceKind: "remote",
    help: "Where Sync fetches content from. You can set or change it later.",
  });

export const autopublishField = <T extends { autopublish?: unknown }>(
  f: IFieldBuilders<T>,
) =>
  f.switch("autopublish", {
    label: "Auto-publish",
    help: "Publish every new version, and update the distributions serving this repository.",
  });

/** A signing-service picker for one of a repository's signing-service fields. */
export const signingServiceField = <T, K extends keyof T & string>(
  f: IFieldBuilders<T>,
  key: K,
  { label, help }: { label: string; help?: string },
) => f.resource(key, { label, help, resourceKind: "signingService" });

interface IRetentionKeys {
  retain_repo_versions?: unknown;
  retain_checkpoints?: unknown;
}

/** How much history a repository keeps. */
export const retentionSection = <T extends IRetentionKeys>({
  f,
  s,
}: {
  f: IFieldBuilders<T>;
  s: ISectionBuilders;
}) =>
  s.collapsible("retention", "Retention", [
    f.row([
      f.number("retain_repo_versions", {
        label: "Retained versions",
        help: "How many of the newest versions to keep; older ones are deleted. Empty keeps all.",
      }),
      f.number("retain_checkpoints", {
        label: "Retained checkpoints",
        help: "How many checkpoint publications to keep. Empty keeps all.",
      }),
    ]),
  ]);

export const labelsSection = <T extends { pulp_labels?: unknown }>({
  f,
  s,
}: {
  f: IFieldBuilders<T>;
  s: ISectionBuilders;
}) => s.collapsible("labels", "Labels", [labelsField(f)]);
