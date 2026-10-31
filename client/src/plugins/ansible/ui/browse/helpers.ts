/** Fully qualified collection name, the identity Galaxy shows. */
export const fqcn = ({
  namespace,
  name,
}: {
  namespace?: string;
  name?: string;
}) => `${namespace}.${name}`;
