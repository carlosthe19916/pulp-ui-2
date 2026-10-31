import type { IEntityField } from "@app/utils/entityField";
import type { IActionUi } from "@plugin-sdk/ui";

/** The `relative_path` an uploaded file is stored under, for upload forms. */
export const relativePathField = ({
  required = false,
}: { required?: boolean } = {}): IEntityField => ({
  key: "relative_path",
  label: "Relative path",
  type: "text",
  required,
});

/** The fields every content guard's modal starts with. */
export const contentGuardBaseFields: IEntityField[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "description", label: "Description", type: "textarea" },
];

/** An "Advanced copy" action: one JSON config of copy entries (`/<plugin>/copy/`). */
export const advancedCopyAction = ({
  description,
}: {
  description: string;
}): IActionUi => ({
  label: "Advanced copy",
  description,
  fields: [
    {
      key: "config",
      label: "Config",
      type: "json",
      required: true,
      helpText:
        'A list of {"source_repo_version", "dest_repo", "content"} entries.',
    },
  ],
});

/** A version's vulnerability scan (`scan/`). */
export const scanAction: IActionUi = {
  label: "Scan for vulnerabilities",
  description:
    "Checks this version's packages against known vulnerabilities and stores a report.",
  fields: [],
};
