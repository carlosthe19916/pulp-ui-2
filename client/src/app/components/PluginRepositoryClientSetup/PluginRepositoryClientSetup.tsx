import type React from "react";

import { Content, Stack } from "@patternfly/react-core";

import type { DistributionResponse } from "@app/client";
import { Snippet } from "@app/components/Snippet";
import { resolvePulpType } from "@app/queries/utils/pulpHref";

interface IClientSetup {
  hint: string;
  code: string;
}

/** The fields a snippet reads; container and ansible serve from other URLs than `base_url`. */
interface IServedAt {
  name: string;
  baseUrl: string;
  registryPath: string;
  clientUrl: string;
}

/** How a client consumes a distribution, keyed by plugin (the distribution pulp_type prefix). */
const CLIENT_SETUP_BY_PLUGIN: Record<
  string,
  (served: IServedAt) => IClientSetup | null
> = {
  maven: ({ name, baseUrl }) => ({
    hint: "Add to the <repositories> section of pom.xml or settings.xml.",
    code: `<repository>\n  <id>${name}</id>\n  <url>${baseUrl}</url>\n</repository>`,
  }),
  python: ({ baseUrl }) => ({
    hint: "Install a package from this index.",
    code: `pip install --index-url ${baseUrl}simple/ <package>`,
  }),
  npm: ({ baseUrl }) => ({
    hint: "Use this registry for npm installs.",
    code: `npm config set registry ${baseUrl}`,
  }),
  container: ({ registryPath }) =>
    registryPath
      ? {
          hint: "Pull an image by tag.",
          code: `podman pull ${registryPath}:<tag>`,
        }
      : null,
  ansible: ({ name, clientUrl }) =>
    clientUrl
      ? {
          hint: "Add a Galaxy server to ansible.cfg.",
          code: `[galaxy]\nserver_list = ${name}\n\n[galaxy_server.${name}]\nurl = ${clientUrl}\ntoken = <put your token here>`,
        }
      : null,
  rpm: ({ name, baseUrl }) => ({
    hint: `Save as /etc/yum.repos.d/${name}.repo.`,
    code: `[${name}]\nname=${name}\nbaseurl=${baseUrl}\nenabled=1`,
  }),
  deb: ({ baseUrl }) => ({
    hint: "Add to /etc/apt/sources.list.d/.",
    code: `deb ${baseUrl} <distribution> <component>`,
  }),
  gem: ({ baseUrl }) => ({
    hint: "Install a gem from this source.",
    code: `gem install --source ${baseUrl} <gem>`,
  }),
  file: ({ baseUrl }) => ({
    hint: "Download a file by its relative path.",
    code: `curl -O ${baseUrl}<relative_path>`,
  }),
  ostree: ({ name, baseUrl }) => ({
    hint: "Add this repository as an OSTree remote.",
    code: `ostree remote add ${name} ${baseUrl}`,
  }),
  hugging_face: ({ baseUrl }) => ({
    hint: "Point the Hugging Face client at this endpoint.",
    code: `HF_ENDPOINT=${baseUrl} huggingface-cli download <repo_id>`,
  }),
};

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

interface IPluginRepositoryClientSetupProps {
  distribution: DistributionResponse;
}

/**
 * Plugin-specific client configuration for one distribution. Unknown plugins fall back
 * to the copyable serving URL.
 */
export const PluginRepositoryClientSetup: React.FC<
  IPluginRepositoryClientSetupProps
> = ({ distribution }) => {
  const record = distribution as Record<string, unknown>;
  const served: IServedAt = {
    name: distribution.name,
    baseUrl: asString(record.base_url),
    registryPath: asString(record.registry_path),
    clientUrl: asString(record.client_url),
  };
  const plugin = resolvePulpType(distribution.pulp_href)?.split(".")[0] ?? "";
  const setup = CLIENT_SETUP_BY_PLUGIN[plugin]?.(served);
  const url = served.baseUrl || served.registryPath || served.clientUrl;

  if (!setup) {
    return url ? <Snippet code={url} /> : <>—</>;
  }
  return (
    <Stack hasGutter>
      <Content component="p">{setup.hint}</Content>
      <Snippet code={setup.code} />
    </Stack>
  );
};
