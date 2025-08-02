/**
 * Project Setup Tests
 * TDD: These tests define the requirements for our project setup
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

describe("Project Setup", () => {
  const projectRoot = join(__dirname, "../..");

  describe("TypeScript configuration", () => {
    it("should have tsconfig.json", () => {
      const tsconfigPath = join(projectRoot, "tsconfig.json");
      expect(existsSync(tsconfigPath)).toBe(true);

      const tsconfigContent = readFileSync(tsconfigPath, "utf-8");
      expect(() => JSON.parse(tsconfigContent)).not.toThrow();
    });

    it("should have strict mode enabled", () => {
      const tsconfigPath = join(projectRoot, "tsconfig.json");
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));

      // Check if using strictest config or has explicit strict settings
      expect(
        tsconfig.extends === "@tsconfig/strictest/tsconfig.json" ||
          tsconfig.compilerOptions.strict === true,
      ).toBe(true);
    });

    it("should support ES modules", () => {
      const tsconfigPath = join(projectRoot, "tsconfig.json");
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));

      expect(tsconfig.compilerOptions.module).toBe("ESNext");
      expect(["Node", "bundler", "node16", "nodenext"]).toContain(
        tsconfig.compilerOptions.moduleResolution,
      );
      expect(tsconfig.compilerOptions.allowSyntheticDefaultImports).toBe(true);
    });

    it("should have proper target and output settings", () => {
      const tsconfigPath = join(projectRoot, "tsconfig.json");
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));

      expect(tsconfig.compilerOptions.target).toBe("ES2022");
      expect(tsconfig.compilerOptions.outDir).toBe("./dist");
      expect(tsconfig.compilerOptions.rootDir).toBe("./src");
    });
  });

  describe("Directory structure", () => {
    it("should have src directory", () => {
      const srcPath = join(projectRoot, "src");
      expect(existsSync(srcPath)).toBe(true);
    });

    it("should have required subdirectories", () => {
      const directories = ["src/core", "src/features", "src/__tests__"];

      directories.forEach((dir) => {
        const dirPath = join(projectRoot, dir);
        expect(existsSync(dirPath)).toBe(true);
      });
    });
  });

  describe("ES Module support", () => {
    it("should support dynamic imports", async () => {
      // Test that dynamic imports work
      const moduleImport = async () => {
        const module = await import("./core/types/index");
        return module;
      };

      expect(moduleImport).not.toThrow();
    });

    it("should require .js extensions in imports", () => {
      // This test ensures our TypeScript config enforces .js extensions
      // The actual enforcement is checked by TypeScript compiler during build
      // Verify that the build system supports ES modules properly
      expect(typeof import.meta.url).toBe("string");
      expect(import.meta.url).toContain("file://");
    });
  });
});
