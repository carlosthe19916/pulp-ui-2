import type React from "react";
import { lazy } from "react";

/** The module's exports that are components. */
type ViewName<M> = {
  [P in keyof M]: M[P] extends React.ComponentType<never> ? P : never;
}[keyof M];

type LazyView<V> =
  V extends React.ComponentType<infer P>
    ? React.LazyExoticComponent<React.ComponentType<P>>
    : never;

/**
 * Lazy views of one module, loaded on first render so registering every plugin doesn't put
 * their views in the main bundle: `const view = lazyViews(() => import("./browse/RpmBrowse"))`,
 * then `view("RpmPackages")`. Hosts render them inside `Suspense`.
 */
export const lazyViews =
  <M>(load: () => Promise<M>) =>
  <K extends ViewName<M>>(name: K): LazyView<M[K]> =>
    lazy(async () => ({
      default: (await load())[name] as React.ComponentType<object>,
    })) as unknown as LazyView<M[K]>;
