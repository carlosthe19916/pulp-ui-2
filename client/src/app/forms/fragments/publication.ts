import type { IFieldBuilders } from "../kit/defineForm";
import { makeRepositoryVersionField } from "../kit/fields/RepositoryVersionField";
import type { IChoiceOption, IFormContext } from "../kit/types";

/**
 * What a publication publishes: a repository's latest version or one chosen version. The
 * UI-only `$publish` choice shows the matching picker.
 */

/** The `checkpoint` switch of publications that support checkpoints. */
export const CHECKPOINT = {
  label: "Checkpoint",
  help: "Keep this publication as a dated checkpoint that checkpoint distributions serve.",
};

const publishes =
  (choice: "latest" | "version") =>
  ({ values }: IFormContext): boolean =>
    values.$publish === choice;

const PUBLISH_OPTIONS: IChoiceOption[] = [
  {
    value: "latest",
    label: "Latest version",
    description: "Publish the repository as it is now.",
  },
  {
    value: "version",
    label: "A specific version",
    description: "Publish an earlier version of the repository.",
  },
];

/** The publish choice and its two pickers, limited to repositories of `pulpTypes`. */
export const publicationSourceFields = <
  T extends { repository?: unknown; repository_version?: unknown },
>(
  f: IFieldBuilders<T>,
  { pulpTypes }: { pulpTypes: string[] },
) => [
  f.select("$publish", {
    kind: "radio",
    label: "Publish",
    defaultValue: "latest",
    // A UI-only key has no API type to check options against.
    options: PUBLISH_OPTIONS as unknown as IChoiceOption<never>[],
  }),
  f.resource("repository", {
    label: "Repository",
    resourceKind: "repository",
    required: true,
    pulpTypes,
    visibleWhen: publishes("latest"),
  }),
  f.custom("repository_version", {
    label: "Repository version",
    required: true,
    component: makeRepositoryVersionField({ pulpTypes }),
    visibleWhen: publishes("version"),
  }),
];
