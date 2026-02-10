import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  plugins: ["@hey-api/client-axios"],
  input: "./openapi/pulp.json",
  output: {
    path: "src/app/client",
    postProcess: ["biome:format", "biome:lint"],
  },
});
