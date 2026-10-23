import type { RepositoryAddRemoveContent } from "@app/client";
import { parseRepositoryVersionHref } from "@app/queries/utils/pulpHref";

const units = (count: number) => `${count} ${count === 1 ? "unit" : "units"}`;

/** Started-toast title for a content change, e.g. `Removing 2 units from "my-files"`. */
export const contentChangeTitle = ({
  repositoryName,
  body,
}: {
  repositoryName: string;
  body: RepositoryAddRemoveContent;
}): string => {
  const name = `"${repositoryName}"`;
  const added = body.add_content_units ?? [];
  const removed = body.remove_content_units ?? [];
  if (body.base_version) {
    const number = parseRepositoryVersionHref(body.base_version)?.number;
    return `Restoring version ${number} of ${name}`;
  }
  if (removed.includes("*")) return `Removing all content from ${name}`;
  if (removed.length && !added.length) {
    return `Removing ${units(removed.length)} from ${name}`;
  }
  if (added.length && !removed.length) {
    return `Adding ${units(added.length)} to ${name}`;
  }
  return `Changing the content of ${name}`;
};
