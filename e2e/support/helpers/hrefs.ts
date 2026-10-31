/** The last segment of a Pulp href: an object's id, as routes and row titles show it. */
export const idOf = (href: string): string =>
  href.split("/").filter(Boolean).pop() ?? "";
