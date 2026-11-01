const HEX = /^[0-9a-f]+$/i;

/** A fingerprint the way `gpg --fingerprint` prints it: blocks of 4, a wider gap at the middle. */
export const formatFingerprint = (fingerprint: string): string => {
  const raw = fingerprint.replace(/\s/g, "").toUpperCase();
  if (!HEX.test(raw) || raw.length % 4 !== 0) return fingerprint;
  const blocks = raw.match(/.{4}/g) ?? [];
  const half = Math.ceil(blocks.length / 2);
  return `${blocks.slice(0, half).join(" ")}  ${blocks.slice(half).join(" ")}`;
};

/** The long (16-hex) key ID: the fingerprint's tail, or `undefined` when it isn't hex. */
export const longKeyId = (fingerprint: string): string | undefined => {
  const raw = fingerprint.replace(/\s/g, "").toUpperCase();
  return HEX.test(raw) && raw.length >= 16 ? raw.slice(-16) : undefined;
};

/** Saves the ASCII-armored key as `<name>.asc`. */
export const downloadPublicKey = ({
  name,
  publicKey,
}: {
  name: string;
  publicKey: string;
}) => {
  const url = URL.createObjectURL(
    new Blob([publicKey], { type: "application/pgp-keys" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.asc`;
  link.click();
  URL.revokeObjectURL(url);
};
