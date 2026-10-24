/** `os/arch` of a single-platform manifest, or "" when unknown. */
export const platformOf = ({
  os,
  architecture,
}: {
  os?: string;
  architecture?: string;
}) => (os || architecture ? `${os ?? "?"}/${architecture ?? "?"}` : "");

/** `name-[epoch:]version-release.arch`, how dnf and Satellite name a package. */
export interface INevraParams {
  name?: string;
  epoch?: string;
  version?: string;
  release?: string;
  arch?: string;
}

export const nevra = ({ name, epoch, version, release, arch }: INevraParams) =>
  `${name}-${epoch && epoch !== "0" ? `${epoch}:` : ""}${version}-${release}.${arch}`;
