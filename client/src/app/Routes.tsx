import { lazy } from "react";
import { createBrowserRouter, useParams, type Params } from "react-router-dom";

import { LazyRouteElement } from "@app/components/LazyRouteElement";

import App from "./App";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import { queryClient } from "./queries/config";
import { packageByIdQueryOptions } from "./queries/packages";

const PythonList = lazy(() => import("./pages/python-list"));
const PythonDetails = lazy(() => import("./pages/python-details"));
const NotFound = lazy(() => import("./pages/not-found"));

export const PathParam = {
  PYTHON_ID: "pythonId",
} as const;

type PathParamType = (typeof PathParam)[keyof typeof PathParam];

export const Paths = {
  python: "/",
  pythonDetails: `/:${PathParam.PYTHON_ID}`,
} as const;

export const usePathFromParams = (
  params: Params<string>,
  pathParam: PathParamType,
) => {
  const value = params[pathParam];
  if (value === undefined) {
    throw new Error(
      `ASSERTION FAILURE: required path parameter not set: ${pathParam}`,
    );
  }
  return value;
};

export const AppRoutes = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: Paths.python,
        element: (
          <LazyRouteElement identifier="python" component={<PythonList />} />
        ),
      },
      {
        path: Paths.pythonDetails,
        element: (
          <LazyRouteElement
            identifier="advisory-details"
            component={<PythonDetails />}
          />
        ),
        errorElement: <RouteErrorBoundary />,
        loader: async ({ params }) => {
          const packageId = usePathFromParams(params, PathParam.PYTHON_ID);
          const response = await queryClient.ensureQueryData(
            packageByIdQueryOptions(packageId),
          );
          return {
            package: response,
          };
        },
      },
      {
        path: "*",
        element: (
          <LazyRouteElement identifier="not-found" component={<NotFound />} />
        ),
      },
    ],
  },
]);

export const useRouteParams = (pathParam: PathParamType) => {
  const params = useParams();
  const value = params[pathParam];
  if (value === undefined) {
    throw new Error(
      `ASSERTION FAILURE: required path parameter not set: ${pathParam}`,
    );
  }
  return value;
};
