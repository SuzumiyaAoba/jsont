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
    environment: "jsdom", // Keep jsdom for React components
    globals: true,
    setupFiles: ["./src/vitest.setup.ts"],
    // Aggressive memory optimization for CI
    pool: "threads",
    poolOptions: {
      threads: {
        maxThreads: 1,
        minThreads: 1,
        isolate: true,
        singleThread: true,
      },
    },
    testTimeout: 15000, // Reduced timeout for CI
    hookTimeout: 5000,
    maxConcurrency: 1,
    coverage: {
      provider: "v8",
      reporter: ["text", "json"],
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
    // Only include critical core utility tests for CI
    include: [
      "src/core/utils/lruCache.spec.ts",
      "src/core/utils/result.spec.ts",
      "src/core/utils/errorHandler.spec.ts",
      "src/core/utils/cliParser.spec.ts",
      "src/core/utils/heightCalculations.spec.ts",
      "src/core/utils/keybindings.spec.ts",
      "src/core/utils/dataConverters/XmlConverter.spec.ts",
      "src/features/common/components/TextInput.spec.tsx",
      "src/core/config/constants.spec.ts",
      "src/core/config/schema.spec.ts",
    ],
    exclude: [
      "node_modules/",
      "dist/",
      "build/",
      // Exclude all potentially memory-intensive tests for CI
      "src/performance.spec.ts",
      "src/error-scenarios.spec.ts",
      "src/json-processing.spec.ts",
      "src/core/utils/stdinHandler.spec.ts",
      "src/library-integration.spec.ts",
      "src/integration/**",
      "src/core/utils/dataConverters/SqlConverter.spec.ts",
      "src/core/services/appService.spec.ts",
      "src/features/json-rendering/utils/syntaxHighlight.spec.ts",
      "src/core/utils/processManager.spec.ts",
      "src/features/collapsible/utils/collapsibleJson.spec.ts",
    ],
  },
});
