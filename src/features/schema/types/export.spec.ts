/**
 * Tests for export type definitions
 */

import { describe, expect, it } from "vitest";
import type { ExportDialogState, ExportPreferences } from "./export";

describe("export types", () => {
  describe("ExportDialogState", () => {
    it("should create valid export dialog state object", () => {
      const dialogState: ExportDialogState = {
        isVisible: true,
        mode: "simple",
      };

      expect(dialogState.isVisible).toBe(true);
      expect(dialogState.mode).toBe("simple");
    });

    it("should work with advanced mode", () => {
      const dialogState: ExportDialogState = {
        isVisible: false,
        mode: "advanced",
      };

      expect(dialogState.isVisible).toBe(false);
      expect(dialogState.mode).toBe("advanced");
    });

    it("should handle boolean visibility states", () => {
      const visibleState: ExportDialogState = {
        isVisible: true,
        mode: "simple",
      };

      const hiddenState: ExportDialogState = {
        isVisible: false,
        mode: "simple",
      };

      expect(visibleState.isVisible).toBe(true);
      expect(hiddenState.isVisible).toBe(false);
    });
  });

  describe("ExportPreferences", () => {
    it("should create valid export preferences object", () => {
      const preferences: ExportPreferences = {
        lastDirectory: "/home/user/exports",
        defaultFilename: "my-schema.json",
        format: "json",
        rememberLocation: true,
      };

      expect(preferences.lastDirectory).toBe("/home/user/exports");
      expect(preferences.defaultFilename).toBe("my-schema.json");
      expect(preferences.format).toBe("json");
      expect(preferences.rememberLocation).toBe(true);
    });

    it("should work with different directory paths", () => {
      const preferences: ExportPreferences = {
        lastDirectory: process.cwd(),
        defaultFilename: "schema.json",
        format: "json",
        rememberLocation: false,
      };

      expect(preferences.lastDirectory).toBe(process.cwd());
      expect(preferences.rememberLocation).toBe(false);
    });

    it("should handle custom filenames", () => {
      const customFilenames = [
        "user-schema.json",
        "api-schema.json",
        "database-schema.json",
        "custom_schema_2024.json",
      ];

      customFilenames.forEach((filename) => {
        const preferences: ExportPreferences = {
          lastDirectory: "/tmp",
          defaultFilename: filename,
          format: "json",
          rememberLocation: true,
        };

        expect(preferences.defaultFilename).toBe(filename);
      });
    });

    it("should only support json format currently", () => {
      const preferences: ExportPreferences = {
        lastDirectory: "/tmp",
        defaultFilename: "test.json",
        format: "json", // Only json is supported currently
        rememberLocation: true,
      };

      expect(preferences.format).toBe("json");
    });

    it("should handle remember location preference", () => {
      const rememberTrue: ExportPreferences = {
        lastDirectory: "/home/user",
        defaultFilename: "schema.json",
        format: "json",
        rememberLocation: true,
      };

      const rememberFalse: ExportPreferences = {
        lastDirectory: "/tmp",
        defaultFilename: "temp.json",
        format: "json",
        rememberLocation: false,
      };

      expect(rememberTrue.rememberLocation).toBe(true);
      expect(rememberFalse.rememberLocation).toBe(false);
    });
  });

  describe("type compatibility", () => {
    it("should work with common directory paths", () => {
      const commonPaths = [
        process.cwd(),
        "/home/user",
        "/tmp",
        "/Users/user/Documents",
        "/Users/user/Downloads",
        "/Users/user/Desktop",
      ];

      commonPaths.forEach((path) => {
        const state: ExportDialogState = {
          isVisible: true,
          mode: "simple",
        };

        const preferences: ExportPreferences = {
          lastDirectory: path,
          defaultFilename: "schema.json",
          format: "json",
          rememberLocation: true,
        };

        expect(typeof state.isVisible).toBe("boolean");
        expect(typeof preferences.lastDirectory).toBe("string");
        expect(preferences.lastDirectory).toBe(path);
      });
    });

    it("should maintain type safety", () => {
      // These should compile without errors
      const state: ExportDialogState = {
        isVisible: false,
        mode: "advanced",
      };

      const prefs: ExportPreferences = {
        lastDirectory: "/test/path",
        defaultFilename: "test-schema.json",
        format: "json",
        rememberLocation: false,
      };

      // Type assertions to verify correct types
      expect(typeof state.isVisible).toBe("boolean");
      expect(["simple", "advanced"]).toContain(state.mode);
      expect(typeof prefs.lastDirectory).toBe("string");
      expect(typeof prefs.defaultFilename).toBe("string");
      expect(prefs.format).toBe("json");
      expect(typeof prefs.rememberLocation).toBe("boolean");
    });
  });
});
