import adapter from "@sveltejs/adapter-static";
import { config as dotenv } from "dotenv";
import path from "node:path";

dotenv({ quiet: true });

const BUILD_DIR = process.env.BUILD_DIR || "build";

/** @type {import("@sveltejs/kit").Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: BUILD_DIR,
      assets: BUILD_DIR,
      fallback: undefined,
      precompress: false,
      strict: true,
    }),
    alias: {
      "@/api": path.resolve(import.meta.dirname, "src/api"),
    },
  },
};

export default config;
