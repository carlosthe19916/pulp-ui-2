import { useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PulpEndpoint,
  PulpRootEndpoint,
} from "@app/client/pulpEndpoints.gen";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { apiSpecQueryOptions } from "@app/queries/apiSpec";
import { statusQueryOptions, useStatusQuery } from "@app/queries/status";
import {
  pulpApiPath,
  pulpRootApiPath,
  toProxyHref,
} from "@app/queries/utils/pulpApi";

import type { ICommandContext } from "./commands";
import { buildCommandTree, cliWord, type CommandTree } from "./commandTree";

const SAFE_PATH = /^\/?[\w\-./]+$/;
const ROOT_ENDPOINTS = new Set<string>(["status/", "livez/"]);

/** The URL of a path relative to `api/v3/` or of a pulp_href; undefined for anything else. */
export const apiUrl = ({
  path,
  domain,
}: {
  path: string;
  domain: Parameters<typeof pulpApiPath>[1];
}): string | undefined => {
  if (!SAFE_PATH.test(path) || path.includes("..")) return undefined;
  const withSlash = path.endsWith("/") ? path : `${path}/`;
  if (withSlash.startsWith("/")) {
    const href = toProxyHref(withSlash);
    return /^\/api\/pulp\/(?:[\w-]+\/)?api\/v3\//.test(href) ? href : undefined;
  }
  return ROOT_ENDPOINTS.has(withSlash)
    ? pulpRootApiPath(withSlash as PulpRootEndpoint)
    : pulpApiPath(withSlash as PulpEndpoint, domain);
};

/** What the terminal's commands read through: the server's spec and API, as the signed-in user. */
export const useCommandContext = (): ICommandContext => {
  const queryClient = useQueryClient();
  const domain = useSelectedDomain();
  const { data: status } = useStatusQuery();
  const treesRef = useRef(new Map<string, Promise<CommandTree>>());
  // Commands run from xterm's callbacks; they read the domain at run time.
  const domainRef = useRef(domain);
  domainRef.current = domain;

  const components = async () =>
    (await queryClient.query(statusQueryOptions)).versions.map(
      (version) => version.component,
    );

  return {
    plugins: pluginWords(
      status?.versions.map((version) => version.component) ?? [],
    ),
    treeFor: async (group) => {
      const component =
        (await components()).find(
          (name) => name !== "core" && cliWord(name) === group,
        ) ?? "core";
      const cached = treesRef.current.get(component);
      if (cached) return cached;
      const tree = queryClient
        .query(apiSpecQueryOptions(component))
        .then(buildCommandTree);
      treesRef.current.set(component, tree);
      return tree;
    },
    get: async (path, params) => {
      const url = apiUrl({ path, domain: domainRef.current });
      if (!url) throw new Error(`"${path}" is not a Pulp API path.`);
      return (await axiosInstance.get(url, { params })).data;
    },
  };
};

/** The CLI words of the installed plugins, from status/. */
export const pluginWords = (components: string[]) =>
  components
    .filter((name) => name !== "core")
    .map(cliWord)
    .sort();
