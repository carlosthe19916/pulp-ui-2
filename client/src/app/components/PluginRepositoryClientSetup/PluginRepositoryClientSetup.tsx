import type React from "react";

import { Content, Stack } from "@patternfly/react-core";

import type { DistributionResponse } from "@app/client";
import { Snippet } from "@app/components/Snippet";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import type { IClientServedAt } from "@plugin-sdk/ui";
import { getClientSetup } from "@plugins";

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

interface IPluginRepositoryClientSetupProps {
  distribution: DistributionResponse;
}

/**
 * How a client consumes one distribution, from its plugin; without one, the copyable
 * serving URL.
 */
export const PluginRepositoryClientSetup: React.FC<
  IPluginRepositoryClientSetupProps
> = ({ distribution }) => {
  const record = distribution as Record<string, unknown>;
  const served: IClientServedAt = {
    name: distribution.name,
    baseUrl: asString(record.base_url),
    registryPath: asString(record.registry_path),
    clientUrl: asString(record.client_url),
  };
  const setup = getClientSetup(resolvePulpType(distribution.pulp_href) ?? "")?.(
    served,
  );
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
