/**
 * Tests for tree line generation and visible line calculation
 * Specifically testing the functionality around line 26 and getVisibleTreeLines
 */

import { describe, expect, it } from "vitest";
import { buildTreeFromJson, expandAll } from "./treeBuilder";
import {
  getTreeLineText,
  getVisibleTreeLines,
  renderTreeLines,
} from "./treeRenderer";

describe("Tree Line Generation and Visibility", () => {
  // Debug data from debug_test.json
  const debugData = {
    scripts: {
      build: "tsup",
      dev: "tsx src/index.tsx",
      start: "node dist/index.js",
      test: "vitest",
      "test:ui": "vitest --ui",
      "test:run": "vitest run",
      "test:watch": "vitest --watch",
      lint: "biome lint ./src",
      "lint:fix": "biome lint --write ./src",
      format: "biome format ./src",
      "format:write": "biome format --write ./src",
      check: "biome check ./src",
      "check:write": "biome check --write ./src",
      "type-check": "tsc --noEmit",
      prepare: "husky",
    },
    keywords: ["json", "tui", "terminal", "cli", "viewer", "jq", "jsonata"],
    author: "test",
  };

  const defaultOptions = {
    showArrayIndices: true,
    showPrimitiveValues: true,
    maxValueLength: 50,
    useUnicodeTree: true,
    showSchemaTypes: false,
  };

  describe("Full tree line generation", () => {
    it("should generate exactly 26 lines for debug data when fully expanded", () => {
      let treeState = buildTreeFromJson(debugData);
      treeState = expandAll(treeState);
      const lines = renderTreeLines(treeState, defaultOptions);

      expect(lines).toHaveLength(26);
    });

    it("should have correct content for line 26 (author field)", () => {
      let treeState = buildTreeFromJson(debugData);
      treeState = expandAll(treeState);
      const lines = renderTreeLines(treeState, defaultOptions);

      // Line 26 should be the author field (0-based index 25)
      const line26 = lines[25];
      expect(line26).toBeDefined();
      expect(line26.key).toBe("author");
      expect(line26.type).toBe("primitive");
      expect(line26.level).toBe(1);
      expect(line26.id).toBe("__root__.author");

      const displayText = getTreeLineText(line26, defaultOptions);
      expect(displayText).toBe('└─ author: "test"');
    });

    it("should have correct tree structure with proper prefixes", () => {
      let treeState = buildTreeFromJson(debugData);
      treeState = expandAll(treeState);
      const lines = renderTreeLines(treeState, defaultOptions);

      // Verify key structural elements
      const rootLine = lines[0];
      expect(getTreeLineText(rootLine, defaultOptions)).toBe(".");

      const scriptsLine = lines[1];
      expect(getTreeLineText(scriptsLine, defaultOptions)).toBe("├─ scripts");

      const keywordsLine = lines[17]; // Line 18 (0-based index 17)
      expect(getTreeLineText(keywordsLine, defaultOptions)).toBe("├─ keywords");

      const lastKeywordLine = lines[24]; // Line 25 (0-based index 24)
      expect(getTreeLineText(lastKeywordLine, defaultOptions)).toBe(
        '│  └─ 6: "jsonata"',
      );

      const authorLine = lines[25]; // Line 26 (0-based index 25)
      expect(getTreeLineText(authorLine, defaultOptions)).toBe(
        '└─ author: "test"',
      );
    });
  });

  describe("getVisibleTreeLines functionality", () => {
    let allLines: ReturnType<typeof renderTreeLines>;

    beforeEach(() => {
      let treeState = buildTreeFromJson(debugData);
      treeState = expandAll(treeState);
      allLines = renderTreeLines(treeState, defaultOptions);
    });

    it("should return correct slice for first 10 lines", () => {
      const visibleLines = getVisibleTreeLines(allLines, 0, 10);

      expect(visibleLines).toHaveLength(10);
      expect(getTreeLineText(visibleLines[0], defaultOptions)).toBe(".");
      expect(getTreeLineText(visibleLines[1], defaultOptions)).toBe(
        "├─ scripts",
      );
      expect(getTreeLineText(visibleLines[9], defaultOptions)).toBe(
        '│  ├─ lint: "biome lint ./src"',
      );
    });

    it("should return correct slice around line 26", () => {
      const visibleLines = getVisibleTreeLines(allLines, 20, 26);

      expect(visibleLines).toHaveLength(6);
      // Should include lines 21-26 (0-based indices 20-25)
      expect(getTreeLineText(visibleLines[0], defaultOptions)).toBe(
        '│  ├─ 2: "terminal"',
      );
      expect(getTreeLineText(visibleLines[5], defaultOptions)).toBe(
        '└─ author: "test"',
      );
    });

    it("should return just line 26 when requested", () => {
      const visibleLines = getVisibleTreeLines(allLines, 25, 26);

      expect(visibleLines).toHaveLength(1);
      expect(getTreeLineText(visibleLines[0], defaultOptions)).toBe(
        '└─ author: "test"',
      );
    });

    it("should handle edge cases correctly", () => {
      // Request beyond the end of the array
      const visibleLines = getVisibleTreeLines(allLines, 25, 30);
      expect(visibleLines).toHaveLength(1); // Only line 26 exists

      // Request empty range
      const emptyLines = getVisibleTreeLines(allLines, 26, 26);
      expect(emptyLines).toHaveLength(0);

      // Request from start of non-existent range
      const nonExistentLines = getVisibleTreeLines(allLines, 30, 35);
      expect(nonExistentLines).toHaveLength(0);
    });

    it("should maintain correct line indexing", () => {
      const visibleLines = getVisibleTreeLines(allLines, 24, 26);

      expect(visibleLines).toHaveLength(2);

      // Line 25 (0-based index 24)
      const line25 = visibleLines[0];
      expect(line25.key).toBe("6");
      expect(line25.value).toBe('"jsonata"');

      // Line 26 (0-based index 25)
      const line26 = visibleLines[1];
      expect(line26.key).toBe("author");
      expect(line26.value).toBe('"test"');
    });
  });

  describe("Line display consistency", () => {
    it("should generate consistent line content regardless of how it's accessed", () => {
      let treeState = buildTreeFromJson(debugData);
      treeState = expandAll(treeState);
      const allLines = renderTreeLines(treeState, defaultOptions);

      // Get line 26 directly from full array
      const directLine26 = allLines[25];
      const directDisplayText = getTreeLineText(directLine26, defaultOptions);

      // Get line 26 via getVisibleTreeLines
      const visibleLines = getVisibleTreeLines(allLines, 25, 26);
      const visibleLine26 = visibleLines[0];
      const visibleDisplayText = getTreeLineText(visibleLine26, defaultOptions);

      expect(directDisplayText).toBe(visibleDisplayText);
      expect(directDisplayText).toBe('└─ author: "test"');
    });

    it("should maintain object references correctly", () => {
      let treeState = buildTreeFromJson(debugData);
      treeState = expandAll(treeState);
      const allLines = renderTreeLines(treeState, defaultOptions);

      const visibleLines = getVisibleTreeLines(allLines, 25, 26);
      const line26FromVisible = visibleLines[0];
      const line26FromAll = allLines[25];

      // Should be the exact same object reference
      expect(line26FromVisible).toBe(line26FromAll);
    });
  });
});
