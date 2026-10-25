/**
 * The permission list with a typed codename added (trimmed, sorted); unchanged when the
 * codename is blank or already listed.
 */
export const addPermission = ({
  permissions,
  draft,
}: {
  permissions: string[];
  draft: string;
}): string[] => {
  const permission = draft.trim();
  if (!permission || permissions.includes(permission)) {
    return permissions;
  }
  return [...permissions, permission].sort((a, b) => a.localeCompare(b));
};
