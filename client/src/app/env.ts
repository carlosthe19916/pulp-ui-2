import { buildPulpEnv, decodeEnv } from "@pulp-ui/common";

export const ENV = buildPulpEnv(decodeEnv(window._env));

export default ENV;
