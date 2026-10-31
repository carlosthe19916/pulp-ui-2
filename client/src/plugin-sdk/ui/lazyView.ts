import type React from "react";
import { lazy } from "react";

/**
 * A plugin view loaded on first render, so registering every plugin doesn't put their views in
 * the main bundle. `name` is the module's named export; hosts render it inside `Suspense`.
 */
export const lazyView = <M, K extends keyof M>({
  load,
  name,
}: {
  load: () => Promise<M>;
  name: K;
}) =>
  lazy(async () => ({
    default: (await load())[name] as React.ComponentType<object>,
  })) as unknown as M[K] extends React.ComponentType<infer P>
    ? React.LazyExoticComponent<React.ComponentType<P>>
    : never;
