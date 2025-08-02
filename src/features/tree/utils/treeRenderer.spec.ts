/**
 * Tests for tree renderer utilities
 */

import { buildTreeFromJson } from "@features/tree/utils/treeBuilder";
import {
  getTreeLineText,
  renderTreeLines,
  searchTreeNodes,
} from "@features/tree/utils/treeRenderer";
import { describe, expect, it } from "vitest";
import type { TreeLine } from "../types/tree";

describe("treeRenderer", () => {
  describe("renderTreeLines", () => {
    it("should render simple object as tree lines", () => {
      const data = { name: "John", age: 30 };
      const tree = buildTreeFromJson(data);
      const options = {
        showArrayIndices: true,
        showPrimitiveValues: true,
        maxValueLength: 50,
        useUnicodeTree: true,
        showSchemaTypes: false,
      };

      const lines = renderTreeLines(tree, options);

      expect(lines).toHaveLength(3); // root + 2 properties
      expect(lines[0]?.type).toBe("object");
      expect(lines[1]?.key).toBe("name");
      expect(lines[1]?.value).toBe('"John"');
      expect(lines[2]?.key).toBe("age");
      expect(lines[2]?.value).toBe("30");

      // Test actual display text with proper indentation
      expect(lines[0]).toBeDefined();
      expect(getTreeLineText(lines[0] as TreeLine)).toBe(".");
      expect(lines[1]).toBeDefined();
      expect(getTreeLineText(lines[1] as TreeLine)).toBe('├─ name: "John"');
      expect(lines[2]).toBeDefined();
      expect(getTreeLineText(lines[2] as TreeLine)).toBe("└─ age: 30");
    });

    it("should render array with indices", () => {
      const data = ["a", "b", "c"];
      const tree = buildTreeFromJson(data);
      const options = {
        showArrayIndices: true,
        showPrimitiveValues: true,
        maxValueLength: 50,
        useUnicodeTree: true,
        showSchemaTypes: false,
      };

      const lines = renderTreeLines(tree, options);

      expect(lines).toHaveLength(4); // root + 3 items
      expect(lines[0]?.type).toBe("array");
      expect(lines[1]?.key).toBe("0");
      expect(lines[1]?.value).toBe('"a"');
      expect(lines[2]?.key).toBe("1");
      expect(lines[2]?.value).toBe('"b"');

      // Test actual display text with proper indentation for array
      expect(getTreeLineText(lines[0]!)).toBe("3:");
      expect(lines[1]).toBeDefined();
      expect(getTreeLineText(lines[1]!)).toBe('├─ 0: "a"');
      expect(getTreeLineText(lines[2]!)).toBe('├─ 1: "b"');
      expect(lines[3]).toBeDefined();
      expect(getTreeLineText(lines[3]!)).toBe('└─ 2: "c"');
    });

    it("should handle nested structures", () => {
      const data = {
        user: {
          name: "John",
          contacts: ["email", "phone"],
        },
      };
      const tree = buildTreeFromJson(data);
      const options = {
        showArrayIndices: true,
        showPrimitiveValues: true,
        maxValueLength: 50,
        useUnicodeTree: true,
        showSchemaTypes: false,
      };

      const lines = renderTreeLines(tree, options);

      expect(lines.length).toBeGreaterThan(3);
      expect(lines[0]?.type).toBe("object");
      expect(lines[1]?.key).toBe("user");
      expect(lines[1]?.type).toBe("object");

      // Test nested structure indentation
      expect(lines[0]).toBeDefined();
      expect(getTreeLineText(lines[0] as TreeLine)).toBe("."); // root object
      expect(lines[1]).toBeDefined();
      expect(getTreeLineText(lines[1] as TreeLine)).toBe("└─ user"); // user object (no extra indentation)
      // The nested elements should have proper indentation from the user level
      const userNameLine = lines.find((line) => line.key === "name");
      const contactsLine = lines.find((line) => line.key === "contacts");
      expect(userNameLine?.prefix).toContain("├─");
      expect(contactsLine?.prefix).toContain("└─");
    });

    it("should use ASCII symbols when useUnicodeTree is false", () => {
      const data = { name: "John" };
      const tree = buildTreeFromJson(data);
      const options = {
        showArrayIndices: true,
        showPrimitiveValues: true,
        maxValueLength: 50,
        useUnicodeTree: false,
        showSchemaTypes: false,
      };

      const lines = renderTreeLines(tree, options);
      const lineText = getTreeLineText((lines[1] || lines[0]) as TreeLine);

      expect(lineText).toContain("`-- "); // ASCII last branch symbol
    });

    it("should truncate long values", () => {
      const data = { longValue: "a".repeat(100) };
      const tree = buildTreeFromJson(data);
      const options = {
        showArrayIndices: true,
        showPrimitiveValues: true,
        maxValueLength: 10,
        useUnicodeTree: true,
        showSchemaTypes: false,
      };

      const lines = renderTreeLines(tree, options);
      const valueLine = lines[1];
      if (!valueLine) throw new Error("Value line not found");

      expect(valueLine.value).toContain("...");
      expect(valueLine.value?.length).toBeLessThan(15);
    });

    it("should not show primitive values when disabled", () => {
      const data = { name: "John" };
      const tree = buildTreeFromJson(data);
      const options = {
        showArrayIndices: true,
        showPrimitiveValues: false,
        maxValueLength: 50,
        useUnicodeTree: true,
        showSchemaTypes: false,
      };

      const lines = renderTreeLines(tree, options);
      const valueLine = lines[1];

      expect(valueLine?.value).toBe("");
    });
  });

  describe("getTreeLineText", () => {
    it("should format line with prefix and expand indicator", () => {
      const line = {
        id: "test",
        level: 1,
        prefix: "├─ ",
        key: "name",
        value: "John",
        type: "primitive" as const,
        hasChildren: false,
      };

      const text = getTreeLineText(line);
      expect(text).toBe("├─ name: John");
    });

    it("should show key name for object nodes", () => {
      const line = {
        id: "test",
        level: 1,
        prefix: "├─ ",
        key: "user",
        value: "",
        type: "object" as const,
        isExpanded: true,
        hasChildren: true,
      };

      const text = getTreeLineText(line);
      expect(text).toBe("├─ user");
    });

    it("should show key name for array nodes", () => {
      const line = {
        id: "test",
        level: 1,
        prefix: "├─ ",
        key: "items",
        value: "",
        type: "array" as const,
        isExpanded: false,
        hasChildren: true,
      };

      const text = getTreeLineText(line);
      expect(text).toBe("├─ items");
    });

    it("should show '.' for root object nodes", () => {
      const line = {
        id: "root",
        level: 0,
        prefix: "",
        key: "",
        value: "",
        type: "object" as const,
        isExpanded: true,
        hasChildren: true,
      };

      const text = getTreeLineText(line);
      expect(text).toBe(".");
    });

    it("should show '1:' for root array nodes", () => {
      const line = {
        id: "root",
        level: 0,
        prefix: "",
        key: "",
        value: "",
        type: "array" as const,
        isExpanded: true,
        hasChildren: true,
      };

      const text = getTreeLineText(line);
      expect(text).toBe("1:");
    });

    it("should show schema types when enabled", () => {
      const line = {
        id: "test",
        level: 1,
        prefix: "├─ ",
        key: "name",
        value: "John",
        type: "primitive" as const,
        isExpanded: false,
        hasChildren: false,
        schemaType: "string",
      };

      const options = {
        showArrayIndices: true,
        showPrimitiveValues: true,
        maxValueLength: 50,
        useUnicodeTree: true,
        showSchemaTypes: true,
      };

      const text = getTreeLineText(line, options);
      expect(text).toBe("├─ name: John <string>");
    });

    it("should not show schema types when disabled", () => {
      const line = {
        id: "test",
        level: 1,
        prefix: "├─ ",
        key: "name",
        value: "John",
        type: "primitive" as const,
        isExpanded: false,
        hasChildren: false,
        schemaType: "string",
      };

      const options = {
        showArrayIndices: true,
        showPrimitiveValues: true,
        maxValueLength: 50,
        useUnicodeTree: true,
        showSchemaTypes: false,
      };

      const text = getTreeLineText(line, options);
      expect(text).toBe("├─ name: John");
    });
  });

  describe("searchTreeNodes", () => {
    it("should find nodes matching search term", () => {
      const data = {
        user: {
          name: "John",
          email: "john@example.com",
        },
        admin: {
          name: "Admin User",
        },
      };
      const tree = buildTreeFromJson(data);

      const matches = searchTreeNodes(tree, "john");

      expect(matches.size).toBeGreaterThan(0);
      // Should find nodes with "john" in key or value
    });

    it("should be case insensitive by default", () => {
      const data = { Name: "JOHN" };
      const tree = buildTreeFromJson(data);

      const matches = searchTreeNodes(tree, "john");

      expect(matches.size).toBeGreaterThan(0);
    });

    it("should support case sensitive search", () => {
      const data = { name: "john", Name: "JOHN" };
      const tree = buildTreeFromJson(data);

      const matches = searchTreeNodes(tree, "john", { caseSensitive: true });

      expect(matches.size).toBeGreaterThan(0);
    });

    it("should optionally exclude values from search", () => {
      const data = { key: "searchterm", other: "value" };
      const tree = buildTreeFromJson(data);

      const withValues = searchTreeNodes(tree, "searchterm", {
        searchValues: true,
      });
      const withoutValues = searchTreeNodes(tree, "searchterm", {
        searchValues: false,
      });

      expect(withValues.size).toBeGreaterThan(0);
      expect(withoutValues.size).toBe(0); // Should not find in values
    });
  });
});
