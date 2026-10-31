/** The pip command that installs from this index. */
export const pipInstall = (baseUrl: string) =>
  `pip install --index-url ${baseUrl}simple/ <package>`;
