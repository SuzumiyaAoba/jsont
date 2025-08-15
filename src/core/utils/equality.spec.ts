/**
 * Tests for performance-optimized equality comparison utilities
 */

import { describe, expect, it } from "vitest";
import { deepEqual, settingsEqual, shallowEqual } from "./equality";

describe("Equality Utilities", () => {
  describe("shallowEqual", () => {
    it("should return true for identical objects", () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { a: 1, b: 2, c: 3 };
      expect(shallowEqual(obj1, obj2)).toBe(true);
    });

    it("should return false for objects with different values", () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { a: 1, b: 2, c: 4 };
      expect(shallowEqual(obj1, obj2)).toBe(false);
    });

    it("should return false for objects with different keys", () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2, c: 3 };
      expect(shallowEqual(obj1, obj2)).toBe(false);
    });

    it("should return true for empty objects", () => {
      expect(shallowEqual({}, {})).toBe(true);
    });

    it("should handle nested objects correctly (shallow comparison)", () => {
      const nested = { x: 1 };
      const obj1 = { a: nested };
      const obj2 = { a: nested };
      const obj3 = { a: { x: 1 } };

      expect(shallowEqual(obj1, obj2)).toBe(true); // Same reference
      expect(shallowEqual(obj1, obj3)).toBe(false); // Different reference
    });
  });

  describe("deepEqual", () => {
    it("should return true for identical primitives", () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual("test", "test")).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
    });

    it("should return false for different primitives", () => {
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual("test", "other")).toBe(false);
      expect(deepEqual(true, false)).toBe(false);
      expect(deepEqual(null, undefined)).toBe(false);
    });

    it("should handle arrays correctly", () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(deepEqual([], [])).toBe(true);
    });

    it("should handle nested arrays", () => {
      expect(
        deepEqual(
          [
            [1, 2],
            [3, 4],
          ],
          [
            [1, 2],
            [3, 4],
          ],
        ),
      ).toBe(true);
      expect(
        deepEqual(
          [
            [1, 2],
            [3, 4],
          ],
          [
            [1, 2],
            [3, 5],
          ],
        ),
      ).toBe(false);
    });

    it("should handle objects correctly", () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(deepEqual({}, {})).toBe(true);
    });

    it("should handle nested objects", () => {
      const obj1 = { a: { b: { c: 1 } } };
      const obj2 = { a: { b: { c: 1 } } };
      const obj3 = { a: { b: { c: 2 } } };

      expect(deepEqual(obj1, obj2)).toBe(true);
      expect(deepEqual(obj1, obj3)).toBe(false);
    });

    it("should handle mixed types correctly", () => {
      expect(deepEqual({ a: [1, 2] }, { a: [1, 2] })).toBe(true);
      expect(deepEqual({ a: [1, 2] }, { a: [1, 3] })).toBe(false);
      expect(deepEqual([{ a: 1 }], [{ a: 1 }])).toBe(true);
      expect(deepEqual([{ a: 1 }], [{ a: 2 }])).toBe(false);
    });

    it("should respect max depth limit", () => {
      const deepObj = {
        level1: { level2: { level3: { level4: { level5: 1 } } } },
      };
      const deepObj2 = {
        level1: { level2: { level3: { level4: { level5: 2 } } } },
      };

      // With depth 3, should not reach level5 difference
      expect(deepEqual(deepObj, deepObj2, 3)).toBe(true);
      // With depth 5, should detect level5 difference
      expect(deepEqual(deepObj, deepObj2, 5)).toBe(false);
    });

    it("should handle circular references gracefully with depth limit", () => {
      interface CircularObj {
        a: number;
        self?: CircularObj;
      }

      const obj1: CircularObj = { a: 1 };
      obj1.self = obj1;

      const obj2: CircularObj = { a: 1 };
      obj2.self = obj2;

      // Should not throw with depth limit
      expect(() => deepEqual(obj1, obj2, 2)).not.toThrow();
    });
  });

  describe("settingsEqual", () => {
    it("should handle typical settings objects", () => {
      const settings1 = {
        theme: "dark",
        fontSize: 14,
        autoSave: true,
        features: ["autocomplete", "syntax-highlight"],
      };
      const settings2 = {
        theme: "dark",
        fontSize: 14,
        autoSave: true,
        features: ["autocomplete", "syntax-highlight"],
      };
      const settings3 = {
        theme: "light",
        fontSize: 14,
        autoSave: true,
        features: ["autocomplete", "syntax-highlight"],
      };

      expect(settingsEqual(settings1, settings2)).toBe(true);
      expect(settingsEqual(settings1, settings3)).toBe(false);
    });

    it("should handle empty settings objects", () => {
      expect(settingsEqual({}, {})).toBe(true);
    });

    it("should handle nested settings", () => {
      const settings1 = {
        display: {
          theme: "dark",
          ui: { sidebar: true, toolbar: false },
        },
      };
      const settings2 = {
        display: {
          theme: "dark",
          ui: { sidebar: true, toolbar: false },
        },
      };
      const settings3 = {
        display: {
          theme: "dark",
          ui: { sidebar: false, toolbar: false },
        },
      };

      expect(settingsEqual(settings1, settings2)).toBe(true);
      expect(settingsEqual(settings1, settings3)).toBe(false);
    });

    it("should be more efficient than JSON.stringify for typical settings", () => {
      const largeSettings = {
        display: { theme: "dark", fontSize: 14 },
        editor: { tabSize: 2, wordWrap: true },
        features: Array.from({ length: 50 }, (_, i) => `feature-${i}`),
        customizations: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`key-${i}`, `value-${i}`]),
        ),
      };

      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        settingsEqual(largeSettings, largeSettings);
      }
      const equalityTime = performance.now() - startTime;

      const startTime2 = performance.now();
      const stringified = JSON.stringify(largeSettings);
      for (let i = 0; i < 1000; i++) {
        stringified === JSON.stringify(largeSettings);
      }
      const jsonStringifyTime = performance.now() - startTime2;

      // settingsEqual should be faster for identical objects (identity check)
      expect(equalityTime).toBeLessThan(jsonStringifyTime);
    });
  });

  describe("Performance comparison with JSON.stringify", () => {
    it("should be faster for identical object references", () => {
      const obj = { a: 1, b: 2, c: { d: 3, e: [4, 5, 6] } };

      const startDeep = performance.now();
      for (let i = 0; i < 10000; i++) {
        deepEqual(obj, obj);
      }
      const deepTime = performance.now() - startDeep;

      const startJson = performance.now();
      const objStringified = JSON.stringify(obj);
      for (let i = 0; i < 10000; i++) {
        objStringified === JSON.stringify(obj);
      }
      const jsonTime = performance.now() - startJson;

      // deepEqual should be much faster for identical references
      expect(deepTime).toBeLessThan(jsonTime);
    });

    it("should handle edge cases that JSON.stringify cannot", () => {
      const objWithUndefined = { a: 1, b: undefined, c: 3 };
      const objWithFunction = { a: 1, b: () => {}, c: 3 };

      // deepEqual should handle these cases
      expect(deepEqual(objWithUndefined, objWithUndefined)).toBe(true);
      expect(deepEqual(objWithFunction, objWithFunction)).toBe(true);

      // These objects would be different when stringified
      const obj1 = { a: 1, b: undefined };
      const obj2 = { a: 1 };

      expect(deepEqual(obj1, obj2)).toBe(false);
      // JSON.stringify would make these appear equal: {"a":1}
      expect(JSON.stringify(obj1) === JSON.stringify(obj2)).toBe(true);
    });
  });
});
