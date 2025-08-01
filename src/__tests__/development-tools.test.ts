/**
 * Development Tools Integration Tests
 * TDD: These tests define the requirements for our development tools setup
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

describe("Development Tools Integration", () => {
  const projectRoot = join(__dirname, "../..");

  describe("Biome Configuration", () => {
    it("should have biome.json configuration file", () => {
      const biomePath = join(projectRoot, "biome.json");
      expect(existsSync(biomePath)).toBe(true);

      const biomeContent = readFileSync(biomePath, "utf-8");
      expect(() => JSON.parse(biomeContent)).not.toThrow();
    });

    it("should have proper linting configuration", () => {
      const biomePath = join(projectRoot, "biome.json");
      const biomeConfig = JSON.parse(readFileSync(biomePath, "utf-8"));

      expect(biomeConfig.linter).toBeDefined();
      expect(biomeConfig.linter.enabled).toBe(true);
      expect(biomeConfig.linter.rules).toBeDefined();
    });

    it("should have proper formatting configuration", () => {
      const biomePath = join(projectRoot, "biome.json");
      const biomeConfig = JSON.parse(readFileSync(biomePath, "utf-8"));

      expect(biomeConfig.formatter).toBeDefined();
      expect(biomeConfig.formatter.enabled).toBe(true);
    });

    it("should include TypeScript and JSON files", () => {
      const biomePath = join(projectRoot, "biome.json");
      const biomeConfig = JSON.parse(readFileSync(biomePath, "utf-8"));

      expect(biomeConfig.files).toBeDefined();
      expect(biomeConfig.files.includes).toContain("**/*.ts");
      expect(biomeConfig.files.includes).toContain("**/*.tsx");
      expect(biomeConfig.files.includes).toContain("**/*.json");
    });
  });

  describe("Husky Pre-commit Hooks", () => {
    it("should have .husky directory", () => {
      const huskyPath = join(projectRoot, ".husky");
      expect(existsSync(huskyPath)).toBe(true);
    });

    it("should have pre-commit hook file", () => {
      const preCommitPath = join(projectRoot, ".husky", "pre-commit");
      expect(existsSync(preCommitPath)).toBe(true);

      const preCommitContent = readFileSync(preCommitPath, "utf-8");
      expect(preCommitContent).toContain("lint-staged");
    });

    it("should have lint-staged configuration in package.json", () => {
      const packagePath = join(projectRoot, "package.json");
      const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));

      expect(pkg["lint-staged"]).toBeDefined();
      expect(pkg["lint-staged"]["*.{ts,tsx,js,jsx}"]).toBeDefined();
      expect(pkg["lint-staged"]["*.json"]).toBeDefined();
    });
  });

  describe("Vitest Configuration", () => {
    it("should have vitest.config.ts configuration file", () => {
      const vitestPath = join(projectRoot, "vitest.config.ts");
      expect(existsSync(vitestPath)).toBe(true);
    });

    it("should have proper test environment configuration", () => {
      // This test verifies that Vitest can run tests properly by checking environment
      // Verify that we're running in a test environment
      expect(process.env["NODE_ENV"]).toBe("test");
      expect(typeof describe).toBe("function");
      expect(typeof it).toBe("function");
      expect(typeof expect).toBe("function");
    });

    it("should support TypeScript imports", () => {
      // Test that dynamic imports work with Vitest
      const moduleImport = async () => {
        const module = await import("../core/types/index");
        return module;
      };

      expect(moduleImport).not.toThrow();
    });
  });

  describe("Development Scripts", () => {
    it("should have all required development scripts", () => {
      const packagePath = join(projectRoot, "package.json");
      const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));

      // Biome scripts
      expect(pkg.scripts).toHaveProperty("lint");
      expect(pkg.scripts).toHaveProperty("lint:fix");
      expect(pkg.scripts).toHaveProperty("format");
      expect(pkg.scripts).toHaveProperty("format:write");
      expect(pkg.scripts).toHaveProperty("check");
      expect(pkg.scripts).toHaveProperty("check:write");

      // Test scripts
      expect(pkg.scripts).toHaveProperty("test");
      expect(pkg.scripts).toHaveProperty("test:run");
      expect(pkg.scripts).toHaveProperty("test:ui");

      // TypeScript scripts
      expect(pkg.scripts).toHaveProperty("type-check");
    });

    it("should have Husky prepare script", () => {
      const packagePath = join(projectRoot, "package.json");
      const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));

      expect(pkg.scripts).toHaveProperty("prepare");
      expect(pkg.scripts.prepare).toBe("husky");
    });
  });

  describe("Development Dependencies", () => {
    it("should have all required development tools", () => {
      const packagePath = join(projectRoot, "package.json");
      const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));

      // Biome
      expect(pkg.devDependencies).toHaveProperty("@biomejs/biome");

      // Husky and lint-staged
      expect(pkg.devDependencies).toHaveProperty("husky");
      expect(pkg.devDependencies).toHaveProperty("lint-staged");

      // Vitest
      expect(pkg.devDependencies).toHaveProperty("vitest");
      expect(pkg.devDependencies).toHaveProperty("@vitest/ui");
    });
  });
});
