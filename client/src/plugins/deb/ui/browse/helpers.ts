/** The `/etc/apt/sources.list` line for one release of the repository. */
export interface ISourcesLineParams {
  baseUrl: string;
  codename: string;
  components?: string[];
}

export const sourcesLine = ({
  baseUrl,
  codename,
  components,
}: ISourcesLineParams) =>
  `deb ${baseUrl} ${codename} ${(components ?? []).join(" ")}`.trim();
