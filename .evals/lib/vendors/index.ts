import type { IVendor } from "../types.ts";
import { claude } from "./claude.ts";
import { cursor } from "./cursor.ts";

// Every vendor the evals can run, keyed by the name `--vendor` takes. To add one, write an
// IVendor next to these and list it here.
export const VENDORS: Record<string, IVendor> = { claude, cursor };
