import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: false,
    clean: true,
    sourcemap: true,
    minify: false,
    external: ["@elizaos/core", "@stellar/stellar-sdk"],
});
