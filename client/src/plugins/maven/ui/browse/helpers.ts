/** A SNAPSHOT's newest build (`1.0-SNAPSHOT` → `20261022.101500-4`), or "" for releases. */
export const snapshotBuild = ({
  version,
  release,
}: {
  version: string;
  release: string;
}) =>
  release && release !== version
    ? release.replace(version.replace(/-SNAPSHOT$/, "-"), "")
    : "";
