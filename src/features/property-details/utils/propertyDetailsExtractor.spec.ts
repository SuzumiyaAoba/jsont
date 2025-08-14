/**
 * Tests for property details extractor utilities
 */

import type { TreeLine } from "@features/tree/types/tree";
import { describe, expect, it } from "vitest";
import {
  extractPropertyDetailsFromPath,
  extractPropertyDetailsFromTreeLine,
} from "./propertyDetailsExtractor";

describe("propertyDetailsExtractor", () => {
  const testData = {
    user: {
      name: "田中太郎",
      age: 30,
      profile: {
        bio: "ソフトウェアエンジニア",
        skills: ["JavaScript", "TypeScript", "React"],
      },
    },
    posts: [
      { id: 1, title: "テスト記事" },
      { id: 2, title: "TypeScript入門" },
    ],
  };

  describe("extractPropertyDetailsFromTreeLine", () => {
    it("should extract details for root object", () => {
      const line: TreeLine = {
        id: "__root__",
        level: 0,
        prefix: "",
        key: "",
        value: "",
        type: "object",
        hasChildren: true,
      };

      const details = extractPropertyDetailsFromTreeLine(line, testData);

      expect(details).toBeTruthy();
      expect(details?.pathString).toBe("root");
      expect(details?.type).toBe("object");
      expect(details?.hasChildren).toBe(true);
      expect(details?.childrenCount).toBe(2);
    });

    it("should extract details for nested object property", () => {
      const line: TreeLine = {
        id: "__root__.user",
        level: 1,
        prefix: "├─ ",
        key: "user",
        value: "",
        type: "object",
        hasChildren: true,
      };

      const details = extractPropertyDetailsFromTreeLine(line, testData);

      expect(details).toBeTruthy();
      expect(details?.pathString).toBe("user");
      expect(details?.key).toBe("user");
      expect(details?.type).toBe("object");
      expect(details?.hasChildren).toBe(true);
      expect(details?.childrenCount).toBe(3);
    });

    it("should extract details for string property", () => {
      const line: TreeLine = {
        id: "__root__.user.name",
        level: 2,
        prefix: "  ├─ ",
        key: "name",
        value: '"田中太郎"',
        type: "primitive",
        hasChildren: false,
      };

      const details = extractPropertyDetailsFromTreeLine(line, testData);

      expect(details).toBeTruthy();
      expect(details?.pathString).toBe("user.name");
      expect(details?.key).toBe("name");
      expect(details?.type).toBe("string");
      expect(details?.hasChildren).toBe(false);
      expect(details?.childrenCount).toBeUndefined();
    });

    it("should extract details for array property", () => {
      const line: TreeLine = {
        id: "__root__.posts",
        level: 1,
        prefix: "├─ ",
        key: "posts",
        value: "",
        type: "array",
        hasChildren: true,
      };

      const details = extractPropertyDetailsFromTreeLine(line, testData);

      expect(details).toBeTruthy();
      expect(details?.pathString).toBe("posts");
      expect(details?.key).toBe("posts");
      expect(details?.type).toBe("array");
      expect(details?.hasChildren).toBe(true);
      expect(details?.childrenCount).toBe(2);
    });

    it("should extract details for array element", () => {
      const line: TreeLine = {
        id: "__root__.posts.0",
        level: 2,
        prefix: "  ├─ ",
        key: "0",
        value: "",
        type: "object",
        hasChildren: true,
      };

      const details = extractPropertyDetailsFromTreeLine(line, testData);

      expect(details).toBeTruthy();
      expect(details?.pathString).toBe("posts.0");
      expect(details?.key).toBe("0");
      expect(details?.type).toBe("object");
      expect(details?.hasChildren).toBe(true);
      expect(details?.childrenCount).toBe(2);
    });

    it("should return null for invalid line", () => {
      const details = extractPropertyDetailsFromTreeLine(
        null as unknown as TreeLine,
        testData,
      );
      expect(details).toBeNull();
    });
  });

  describe("extractPropertyDetailsFromPath", () => {
    it("should extract details for root path", () => {
      const details = extractPropertyDetailsFromPath([], testData);

      expect(details).toBeTruthy();
      expect(details?.pathString).toBe("root");
      expect(details?.type).toBe("object");
      expect(details?.hasChildren).toBe(true);
      expect(details?.childrenCount).toBe(2);
    });

    it("should extract details for object property path", () => {
      const details = extractPropertyDetailsFromPath(["user"], testData);

      expect(details).toBeTruthy();
      expect(details?.pathString).toBe("user");
      expect(details?.key).toBe("user");
      expect(details?.type).toBe("object");
      expect(details?.hasChildren).toBe(true);
      expect(details?.childrenCount).toBe(3);
    });

    it("should extract details for nested property path", () => {
      const details = extractPropertyDetailsFromPath(
        ["user", "name"],
        testData,
      );

      expect(details).toBeTruthy();
      expect(details?.pathString).toBe("user.name");
      expect(details?.key).toBe("name");
      expect(details?.type).toBe("string");
      expect(details?.hasChildren).toBe(false);
      expect(details?.childrenCount).toBeUndefined();
    });

    it("should extract details for array element path", () => {
      const details = extractPropertyDetailsFromPath(["posts", 0], testData);

      expect(details).toBeTruthy();
      expect(details?.pathString).toBe("posts.0");
      expect(details?.key).toBe(0);
      expect(details?.type).toBe("object");
      expect(details?.hasChildren).toBe(true);
      expect(details?.childrenCount).toBe(2);
    });

    it("should return null for invalid path", () => {
      const details = extractPropertyDetailsFromPath(["nonexistent"], testData);
      expect(details).toBeNull();
    });

    it("should return null for null data", () => {
      const details = extractPropertyDetailsFromPath(["user"], null);
      expect(details).toBeNull();
    });
  });
});
