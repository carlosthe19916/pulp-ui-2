import type { IActionUi } from "@plugin-sdk/ui";

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
