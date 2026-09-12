/** Collect a sorted unique list of permission strings from role permission arrays. */
export function collectPermissionOptions(
  rolePermissionLists: Array<string[] | undefined | null>,
  selected: string[] = [],
): string[] {
  const set = new Set<string>();
  for (const list of rolePermissionLists) {
    for (const permission of list ?? []) {
      if (permission) {
        set.add(permission);
      }
    }
  }
  for (const permission of selected) {
    if (permission) {
      set.add(permission);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
