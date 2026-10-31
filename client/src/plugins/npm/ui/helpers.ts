export const npmInstall = (baseUrl: string) =>
  `npm install --registry ${baseUrl} <package>`;
