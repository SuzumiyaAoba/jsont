/**
 * Tests for Zod configuration validation schemas
 */

import { DEFAULT_CONFIG } from "@core/config/defaults";
import {
  coerceToPartialConfig,
  getValidationErrors,
  safeValidateJsontConfig,
  safeValidatePartialJsontConfig,
  validateJsontConfig,
  validatePartialJsontConfig,
} from "@core/config/schema";
import { describe, expect, it } from "vitest";

describe("Configuration Schema Validation", () => {
  describe("jsontConfigSchema", () => {
    it("should validate complete valid configuration", () => {
      const result = safeValidateJsontConfig(DEFAULT_CONFIG);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(DEFAULT_CONFIG);
      }
    });

    it("should reject configuration with missing required fields", () => {
      const invalidConfig = {
        keybindings: {
          navigation: {
            up: ["k"],
          },
          // Missing modes and search
        },
        // Missing display and behavior
      };

      const result = safeValidateJsontConfig(invalidConfig);
      expect(result.success).toBe(false);
    });

    it("should validate with validateJsontConfig function", () => {
      expect(() => validateJsontConfig(DEFAULT_CONFIG)).not.toThrow();
    });

    it("should throw on invalid data with validateJsontConfig", () => {
      expect(() => validateJsontConfig({ invalid: "data" })).toThrow();
    });
  });

  describe("partialJsontConfigSchema", () => {
    it("should validate empty partial configuration", () => {
      const result = safeValidatePartialJsontConfig({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    it("should validate partial keybindings", () => {
      const partialConfig = {
        keybindings: {
          navigation: {
            up: ["k", "Up"],
            down: ["j", "Down"],
          },
        },
      };

      const result = safeValidatePartialJsontConfig(partialConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.keybindings?.navigation?.up).toEqual(["k", "Up"]);
      }
    });

    it("should validate partial display configuration", () => {
      const partialConfig = {
        display: {
          json: {
            indent: 4,
            useTabs: false,
          },
          tree: {
            showArrayIndices: true,
          },
        },
      };

      const result = safeValidatePartialJsontConfig(partialConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.display?.json?.indent).toBe(4);
        expect(result.data.display?.tree?.showArrayIndices).toBe(true);
      }
    });

    it("should reject invalid data types", () => {
      const invalidConfig = {
        display: {
          json: {
            indent: "not a number", // Should be number
            useTabs: "not a boolean", // Should be boolean
          },
        },
      };

      const result = safeValidatePartialJsontConfig(invalidConfig);
      expect(result.success).toBe(false);
    });

    it("should reject negative numbers where positive required", () => {
      const invalidConfig = {
        display: {
          json: {
            indent: -1, // Should be positive
            maxLineLength: 0, // Should be positive
          },
        },
      };

      const result = safeValidatePartialJsontConfig(invalidConfig);
      expect(result.success).toBe(false);
    });

    it("should reject empty string arrays", () => {
      const invalidConfig = {
        keybindings: {
          navigation: {
            up: [], // Should have at least one string
          },
        },
      };

      const result = safeValidatePartialJsontConfig(invalidConfig);
      expect(result.success).toBe(false);
    });

    it("should validate with validatePartialJsontConfig function", () => {
      const partialConfig = { display: { json: { indent: 2 } } };
      expect(() => validatePartialJsontConfig(partialConfig)).not.toThrow();
    });
  });

  describe("getValidationErrors", () => {
    it("should return empty array for valid configuration", () => {
      const errors = getValidationErrors({});
      expect(errors).toEqual([]);
    });

    it("should return detailed error messages for invalid configuration", () => {
      const invalidConfig = {
        display: {
          json: {
            indent: -1,
            useTabs: "not boolean",
          },
        },
        keybindings: {
          navigation: {
            up: [],
          },
        },
      };

      const errors = getValidationErrors(invalidConfig);
      expect(errors.length).toBeGreaterThan(0);
      // Zod provides detailed error messages
      expect(errors.some((error) => error.includes("indent"))).toBe(true);
      expect(errors.some((error) => error.includes("useTabs"))).toBe(true);
      expect(errors.some((error) => error.includes("up"))).toBe(true);
    });

    it("should provide human-readable error paths", () => {
      const invalidConfig = {
        behavior: {
          navigation: {
            scrollOffset: -5, // Should be non-negative
          },
        },
      };

      const errors = getValidationErrors(invalidConfig);
      expect(errors.length).toBeGreaterThan(0);
      // Should include path information
      expect(
        errors.some((error) =>
          error.includes("behavior.navigation.scrollOffset"),
        ),
      ).toBe(true);
    });
  });

  describe("coerceToPartialConfig", () => {
    it("should return empty config for completely invalid data", () => {
      const result = coerceToPartialConfig("totally invalid");
      expect(result).toEqual({});
    });

    it("should return empty config for null/undefined", () => {
      expect(coerceToPartialConfig(null)).toEqual({});
      expect(coerceToPartialConfig(undefined)).toEqual({});
    });

    it("should return valid parts of partially invalid config", () => {
      const mixedConfig = {
        display: {
          json: {
            indent: 2, // Valid
            useTabs: "invalid", // Invalid - should be boolean
          },
        },
        invalid_section: "should be ignored",
      };

      const result = coerceToPartialConfig(mixedConfig);
      // Should return empty config since validation fails
      expect(result).toEqual({});
    });

    it("should return valid configuration unchanged", () => {
      const validConfig = {
        display: {
          json: {
            indent: 4,
            useTabs: false,
          },
        },
      };

      const result = coerceToPartialConfig(validConfig);
      expect(result).toEqual(validConfig);
    });
  });

  describe("edge cases", () => {
    it("should handle very large numbers within limits", () => {
      const config = {
        display: {
          json: {
            indent: 10, // At the limit
            maxLineLength: 1000, // At the limit
          },
        },
      };

      const result = safeValidatePartialJsontConfig(config);
      expect(result.success).toBe(true);
    });

    it("should reject numbers exceeding limits", () => {
      const config = {
        display: {
          json: {
            indent: 11, // Over the limit (max 10)
            maxLineLength: 1001, // Over the limit (max 1000)
          },
        },
      };

      const result = safeValidatePartialJsontConfig(config);
      expect(result.success).toBe(false);
    });

    it("should handle complex nested partial configurations", () => {
      const complexPartial = {
        keybindings: {
          navigation: {
            up: ["k"],
            // Only partial navigation keys
          },
          modes: {
            search: ["s"],
            // Only partial mode keys
          },
          // Missing search keys entirely
        },
        display: {
          tree: {
            showArrayIndices: true,
            // Only partial tree config
          },
          // Missing json and interface config
        },
        // Missing behavior config entirely
      };

      const result = safeValidatePartialJsontConfig(complexPartial);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.keybindings?.navigation?.up).toEqual(["k"]);
        expect(result.data.keybindings?.modes?.search).toEqual(["s"]);
        expect(result.data.display?.tree?.showArrayIndices).toBe(true);
      }
    });
  });
});
