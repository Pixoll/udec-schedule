import { defineConfig } from "@hey-api/openapi-ts";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

// noinspection JSUnusedGlobalSymbols
export default defineConfig({
  input: process.env.API_DOCS_URL ?? "",
  output: {
    path: "./src/api",
    indexFile: false,
    clean: false,
  },
});
