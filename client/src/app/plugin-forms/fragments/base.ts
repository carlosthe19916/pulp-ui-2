import type { IFieldBuilders } from "../kit/defineForm";

/** Fields almost every object has. Each plugin places them where they belong. */
export const nameField = <T extends { name?: unknown }>(f: IFieldBuilders<T>) =>
  f.text("name", { label: "Name", required: true });

export const descriptionField = <T extends { description?: unknown }>(
  f: IFieldBuilders<T>,
) => f.textarea("description", { label: "Description" });

export const urlField = <T extends { url?: unknown }>(
  f: IFieldBuilders<T>,
  { help }: { help?: string } = {},
) =>
  f.url("url", {
    label: "URL",
    required: true,
    help: help ?? "The URL of the external content source to sync from.",
  });
