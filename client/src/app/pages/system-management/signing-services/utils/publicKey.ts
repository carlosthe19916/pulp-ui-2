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
