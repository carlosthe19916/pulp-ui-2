import React from "react";
import { createRoot } from "react-dom/client";

import { AnimationsProvider } from "@patternfly/react-core";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import "@app/dayjs";
import "@app/descriptors";
import { App } from "@app/App";
import { initInterceptors } from "@app/axios-config/apiInit";
import { queryClient } from "@app/queries/config";
import { router } from "./router";
import { AuthProvider } from "@app/context/Auth/AuthProvider";

initInterceptors();

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AnimationsProvider config={{ hasAnimations: true }}>
          <App router={router} />
        </AnimationsProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);
