import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@core": fileURLToPath(new URL("./src/core", import.meta.url)),
      "@features": fileURLToPath(new URL("./src/features", import.meta.url)),
      "@store": fileURLToPath(new URL("./src/store", import.meta.url)),
      "@components": fileURLToPath(
        new URL("./src/components", import.meta.url),
      ),
      "@hooks": fileURLToPath(new URL("./src/hooks", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/vitest.setup.ts"],
    // Optimize memory usage and prevent OOM errors
    pool: "threads",
    poolOptions: {
      threads: {
        maxThreads: 1, // Run only one test file at a time
        minThreads: 1,
        isolate: true,
        singleThread: true, // Force single-threaded execution
      },
    },
    testTimeout: 60000, // Increase timeout for memory-intensive tests
    hookTimeout: 30000,
    maxConcurrency: 1, // Limit concurrent tests within a file
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "build/",
        "coverage/",
        "**/*.d.ts",
        "**/*.config.{js,ts}",
        "test.json",
      ],
    },
    include: ["src/**/*.spec.{ts,tsx}"],
    exclude: [
      "node_modules/",
      "dist/",
      "build/",
      "src/development-tools.spec.ts",
      "src/setup.spec.ts",
    ],
  },
});
