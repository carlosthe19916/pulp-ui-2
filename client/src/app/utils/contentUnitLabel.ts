/**
 * A readable name for a content row in a confirmation list: the first identity a
 * row carries (path, name + version, tag, advisory id, digest), else the href's id.
 */
export const contentUnitLabel = ({
  row,
  href,
}: {
  row: object;
  href: string;
}): string => {
  const fields = row as Record<string, unknown>;
  const text = (key: string) =>
    typeof fields[key] === "string" && fields[key] ? fields[key] : "";
  if (text("relative_path")) return text("relative_path");
  const name = [text("namespace"), text("name")].filter(Boolean).join(".");
  if (name && text("version")) {
    const arch = text("arch") ? `.${text("arch")}` : "";
    return `${[name, text("version"), text("release")].filter(Boolean).join("-")}${arch}`;
  }
  if (name) return name;
  if (text("id")) return text("id");
  if (text("digest")) return text("digest").slice(0, 19);
  return href.split("/").filter(Boolean).pop() ?? href;
};

/** A page of typed rows as selectable units (rows without an href are skipped). */
export const toUnitRefs = <T>({
  rows,
  rowHref,
  pulpType,
}: {
  rows: T[];
  rowHref?: (row: T) => string | null | undefined;
  pulpType?: string;
}) =>
  rows.flatMap((row) => {
    const href = rowHref?.(row);
    return href
      ? [
          {
            href,
            label: contentUnitLabel({ row: row as object, href }),
            pulpType,
          },
        ]
      : [];
  });
