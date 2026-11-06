const HEX = /^[0-9a-f]+$/i;
const KEY_ID_LENGTH = 16;

const normalize = (hex: string) => hex.replace(/\s/g, "").toUpperCase();

/** A fingerprint the way `gpg --fingerprint` prints it: blocks of 4, a wider gap at the middle. */
export const formatFingerprint = (fingerprint: string): string => {
  const raw = normalize(fingerprint);
  if (!HEX.test(raw) || raw.length % 4 !== 0) return fingerprint;
  const blocks = raw.match(/.{4}/g) ?? [];
  const half = Math.ceil(blocks.length / 2);
  return `${blocks.slice(0, half).join(" ")}  ${blocks.slice(half).join(" ")}`;
};

/** The long (16-hex) key ID: the fingerprint's tail, or `undefined` when it isn't hex. */
export const longKeyId = (fingerprint: string): string | undefined => {
  const raw = normalize(fingerprint);
  return HEX.test(raw) && raw.length >= KEY_ID_LENGTH
    ? raw.slice(-KEY_ID_LENGTH)
    : undefined;
};

interface IKeyIdentity {
  fingerprint?: string;
  keyId?: string;
}

/**
 * Reads a key identifier as Pulp writes it: `v4:<hex>`, `v6:<hex>`, `keyid:<16 hex>` or a bare
 * (v4) fingerprint. A v6 key ID is the fingerprint's head (RFC 9580), a v4 one its tail.
 */
export const parseKey = (identifier: string): IKeyIdentity => {
  const separator = identifier.indexOf(":");
  const prefix =
    separator < 0 ? "v4" : identifier.slice(0, separator).toLowerCase();
  const hex = normalize(identifier.slice(separator + 1));
  if (!HEX.test(hex)) return {};
  if (prefix === "keyid") return { keyId: hex };
  if (prefix === "v6")
    return { fingerprint: hex, keyId: hex.slice(0, KEY_ID_LENGTH) };
  return { fingerprint: hex, keyId: longKeyId(hex) };
};
