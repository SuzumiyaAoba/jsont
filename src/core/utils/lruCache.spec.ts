/**
 * Tests for LRUCache utility
 */

import { LRUCache } from "@core/utils/lruCache";
import { describe, expect, it } from "vitest";

describe("LRUCache", () => {
  describe("Constructor", () => {
    it("should create cache with valid max size", () => {
      const cache = new LRUCache<string, number>(10);
      expect(cache.size).toBe(0);
      expect(cache.getStats().maxSize).toBe(10);
    });

    it("should throw error for invalid max size", () => {
      expect(() => new LRUCache<string, number>(0)).toThrow(
        "Cache max size must be greater than 0",
      );
      expect(() => new LRUCache<string, number>(-1)).toThrow(
        "Cache max size must be greater than 0",
      );
    });
  });

  describe("Basic Operations", () => {
    it("should set and get values", () => {
      const cache = new LRUCache<string, number>(3);

      cache.set("a", 1);
      cache.set("b", 2);

      expect(cache.get("a")).toBe(1);
      expect(cache.get("b")).toBe(2);
      expect(cache.get("c")).toBeUndefined();
      expect(cache.size).toBe(2);
    });

    it("should update existing keys", () => {
      const cache = new LRUCache<string, number>(3);

      cache.set("a", 1);
      cache.set("a", 10);

      expect(cache.get("a")).toBe(10);
      expect(cache.size).toBe(1);
    });

    it("should check key existence", () => {
      const cache = new LRUCache<string, number>(3);

      cache.set("a", 1);

      expect(cache.has("a")).toBe(true);
      expect(cache.has("b")).toBe(false);
    });

    it("should delete keys", () => {
      const cache = new LRUCache<string, number>(3);

      cache.set("a", 1);
      cache.set("b", 2);

      expect(cache.delete("a")).toBe(true);
      expect(cache.delete("c")).toBe(false);
      expect(cache.has("a")).toBe(false);
      expect(cache.has("b")).toBe(true);
      expect(cache.size).toBe(1);
    });

    it("should clear all entries", () => {
      const cache = new LRUCache<string, number>(3);

      cache.set("a", 1);
      cache.set("b", 2);
      cache.clear();

      expect(cache.size).toBe(0);
      expect(cache.has("a")).toBe(false);
      expect(cache.has("b")).toBe(false);
    });
  });

  describe("LRU Behavior", () => {
    it("should evict least recently used item when capacity exceeded", () => {
      const cache = new LRUCache<string, number>(2);

      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3); // Should evict "a"

      expect(cache.has("a")).toBe(false);
      expect(cache.has("b")).toBe(true);
      expect(cache.has("c")).toBe(true);
      expect(cache.size).toBe(2);
    });

    it("should update access order on get", () => {
      const cache = new LRUCache<string, number>(2);

      cache.set("a", 1);
      cache.set("b", 2);
      cache.get("a"); // Make "a" most recently used
      cache.set("c", 3); // Should evict "b" (least recently used)

      expect(cache.has("a")).toBe(true);
      expect(cache.has("b")).toBe(false);
      expect(cache.has("c")).toBe(true);
    });

    it("should update access order on set for existing keys", () => {
      const cache = new LRUCache<string, number>(2);

      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("a", 10); // Update "a" and make it most recently used
      cache.set("c", 3); // Should evict "b"

      expect(cache.get("a")).toBe(10);
      expect(cache.has("b")).toBe(false);
      expect(cache.has("c")).toBe(true);
    });
  });

  describe("Statistics", () => {
    it("should provide accurate statistics", () => {
      const cache = new LRUCache<string, number>(5);

      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      const stats = cache.getStats();
      expect(stats.size).toBe(3);
      expect(stats.maxSize).toBe(5);
      expect(stats.utilization).toBe(0.6);
    });

    it("should handle full capacity statistics", () => {
      const cache = new LRUCache<string, number>(2);

      cache.set("a", 1);
      cache.set("b", 2);

      const stats = cache.getStats();
      expect(stats.utilization).toBe(1.0);
    });
  });

  describe("Iterators", () => {
    it("should provide keys iterator", () => {
      const cache = new LRUCache<string, number>(3);

      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      const keys = Array.from(cache.keys());
      expect(keys).toEqual(["a", "b", "c"]);
    });

    it("should provide values iterator", () => {
      const cache = new LRUCache<string, number>(3);

      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      const values = Array.from(cache.values());
      expect(values).toEqual([1, 2, 3]);
    });

    it("should reflect access order in iterators", () => {
      const cache = new LRUCache<string, number>(3);

      cache.set("a", 1);
      cache.set("b", 2);
      cache.get("a"); // Make "a" most recently used

      const keys = Array.from(cache.keys());
      expect(keys).toEqual(["b", "a"]); // "a" moved to end
    });
  });

  describe("Edge Cases", () => {
    it("should handle single item capacity", () => {
      const cache = new LRUCache<string, number>(1);

      cache.set("a", 1);
      expect(cache.get("a")).toBe(1);

      cache.set("b", 2);
      expect(cache.has("a")).toBe(false);
      expect(cache.get("b")).toBe(2);
      expect(cache.size).toBe(1);
    });

    it("should handle complex object keys and values", () => {
      const cache = new LRUCache<{ id: string }, { data: number }>(2);

      const key1 = { id: "test1" };
      const key2 = { id: "test2" };
      const value1 = { data: 100 };
      const value2 = { data: 200 };

      cache.set(key1, value1);
      cache.set(key2, value2);

      expect(cache.get(key1)).toBe(value1);
      expect(cache.get(key2)).toBe(value2);
    });

    it("should handle undefined values", () => {
      const cache = new LRUCache<string, number | undefined>(2);

      cache.set("a", undefined);
      cache.set("b", 2);

      expect(cache.get("a")).toBeUndefined();
      expect(cache.has("a")).toBe(true);
      expect(cache.get("b")).toBe(2);
    });
  });
});
