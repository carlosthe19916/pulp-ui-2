import type { SetLabel } from "@app/client";

/** A single Pulp label; `value` is `null` for a valueless (key-only) label. */
export interface IKeyValue {
  key: string;
  value: string | null;
}

/** The label changes to persist: one `set_label/` per `toSet`, one `unset_label/` per key. */
export interface ILabelChanges {
  toSet: SetLabel[];
  toUnset: string[];
}

/** Pulp keys allow letters, digits, `_`, `-` and `.` (matches the old `labelSchema`). */
export const LABEL_KEY_REGEX = /^[\w.-]+$/;

/** Joins `{ key, value }` into the `key=value` string shown and typed in the UI (`key` alone if valueless). */
export const joinKeyValueAsString = ({ key, value }: IKeyValue): string =>
  value == null ? key : `${key}=${value}`;

/**
 * Parses a `key=value` string into `{ key, value }`, splitting on the first `=` so values
 * may contain `=`. No `=` means a valueless label (`value: null`); a trailing `=` means an
 * empty-string value.
 */
export const splitStringAsKeyValue = (input: string): IKeyValue => {
  const trimmed = input.trim();
  const eq = trimmed.indexOf("=");
  if (eq === -1) return { key: trimmed, value: null };
  return { key: trimmed.slice(0, eq).trim(), value: trimmed.slice(eq + 1) };
};

/**
 * Validates and parses a typed `key=value` label, returning either the parsed label or a UI
 * error message (Pulp has no replace-all write, so the key is the identity of each change).
 */
export const parseLabelInput = (
  input: string,
): IKeyValue | { error: string } => {
  const { key, value } = splitStringAsKeyValue(input);
  if (!key) return { error: "Enter a label as key or key=value" };
  if (!LABEL_KEY_REGEX.test(key)) {
    return { error: "Key may use letters, digits, '_', '-' or '.'" };
  }
  return { key, value };
};

/**
 * Diffs a desired label set against the originals into the per-label changes Pulp needs:
 * `toSet` for new or changed values, `toUnset` for removed keys.
 */
export const diffLabels = (
  original: Record<string, string | null>,
  draft: Record<string, string | null>,
): ILabelChanges => ({
  toSet: Object.entries(draft)
    .filter(([key, value]) => !(key in original) || original[key] !== value)
    .map(([key, value]) => ({ key, value })),
  toUnset: Object.keys(original).filter((key) => !(key in draft)),
});
