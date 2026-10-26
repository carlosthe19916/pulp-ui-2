import path from "node:path";

/** Absolute path to a sample upload file in `support/data/`. */
export const dataFile = (name: string): string =>
  path.join(__dirname, "data", name);
