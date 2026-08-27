import { PULP_ENV, rewritePulpApiPath } from "@pulp-ui/common";

type Logger = {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

const logger: Logger =
  process.env.DEBUG === "1"
    ? console
    : {
        info() {},
        warn: console.warn,
        error: console.error,
      };

export default {
  api: {
    pathFilter: "/api",
    target: PULP_ENV.PULP_API_URL ?? "http://localhost:8080",
    pathRewrite: (path: string) =>
      rewritePulpApiPath(path, PULP_ENV.PULP_API_ROOT ?? ""),
    logger,
    changeOrigin: true,
  },
};
