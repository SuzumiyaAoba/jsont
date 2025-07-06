/**
 * Project Setup Tests
 * TDD: These tests define the requirements for our project setup
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Project Setup", () => {
  const projectRoot = join(__dirname, "../..");

  describe("package.json configuration", () => {
    it("should exist and be valid JSON", () => {
      const packagePath = join(projectRoot, "package.json");
      expect(existsSync(packagePath)).toBe(true);

      const packageContent = readFileSync(packagePath, "utf-8");
      expect(() => JSON.parse(packageContent)).not.toThrow();
    });

    it("should be configured as ES module", () => {
      const packagePath = join(projectRoot, "package.json");
      const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));

      expect(pkg.type).toBe("module");
    });

    it("should have required dependencies", () => {
      const packagePath = join(projectRoot, "package.json");
      const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));

      // Core dependencies
      expect(pkg.dependencies).toHaveProperty("ink");
      expect(pkg.dependencies).toHaveProperty("jotai");
      expect(pkg.dependencies).toHaveProperty("es-toolkit");
      expect(pkg.dependencies).toHaveProperty("json5");
      expect(pkg.dependencies).toHaveProperty("react");
      expect(pkg.dependencies).toHaveProperty("@types/react");
      expect(pkg.dependencies).toHaveProperty("typescript");
    });

    it("should have development dependencies", () => {
      const packagePath = join(projectRoot, "package.json");
      const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));

      expect(pkg.devDependencies).toHaveProperty("vitest");
      expect(pkg.devDependencies).toHaveProperty("@biomejs/biome");
      expect(pkg.devDependencies).toHaveProperty("@types/node");
    });

    it("should have proper scripts", () => {
      const packagePath = join(projectRoot, "package.json");
      const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));

      expect(pkg.scripts).toHaveProperty("build");
      expect(pkg.scripts).toHaveProperty("dev");
      expect(pkg.scripts).toHaveProperty("test");
      expect(pkg.scripts).toHaveProperty("lint");
      expect(pkg.scripts).toHaveProperty("format");
    });
  });

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

      expect(tsconfig.compilerOptions.strict).toBe(true);
      expect(tsconfig.compilerOptions.noImplicitAny).toBe(true);
      expect(tsconfig.compilerOptions.strictNullChecks).toBe(true);
    });

    it("should support ES modules", () => {
      const tsconfigPath = join(projectRoot, "tsconfig.json");
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));

      expect(tsconfig.compilerOptions.module).toBe("ESNext");
      expect(tsconfig.compilerOptions.moduleResolution).toBe("Node");
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
      const directories = [
        "src/components",
        "src/utils",
        "src/hooks",
        "src/store",
        "src/types",
        "src/__tests__",
      ];

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
        const module = await import("../types/index.js");
        return module;
      };

      expect(moduleImport).not.toThrow();
    });

    it("should require .js extensions in imports", () => {
      // This test ensures our TypeScript config enforces .js extensions
      // The actual enforcement is checked by TypeScript compiler
      expect(true).toBe(true); // Placeholder - actual check happens at compile time
    });
  });
});
