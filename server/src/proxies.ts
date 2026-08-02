import { PULP_ENV } from "@pulp-ui/common";

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
    logger,
    changeOrigin: true,
  },
};
