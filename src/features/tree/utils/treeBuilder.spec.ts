/**
 * Tests for tree builder utilities
 */

import {
  buildTreeFromJson,
  collapseAll,
  expandAll,
  toggleNodeExpansion,
} from "@features/tree/utils/treeBuilder.js";
import { describe, expect, it } from "vitest";

describe("treeBuilder", () => {
  describe("buildTreeFromJson", () => {
    it("should build tree from simple object", () => {
      const data = { name: "John", age: 30 };
      const tree = buildTreeFromJson(data);

      expect(tree.rootNodes).toHaveLength(1);
      expect(tree.rootNodes[0]?.type).toBe("object");
      expect(tree.rootNodes[0]?.children).toHaveLength(2);
      expect(tree.rootNodes[0]?.children[0]?.key).toBe("name");
      expect(tree.rootNodes[0]?.children[0]?.value).toBe("John");
      expect(tree.rootNodes[0]?.children[1]?.key).toBe("age");
      expect(tree.rootNodes[0]?.children[1]?.value).toBe(30);
    });

    it("should build tree from array", () => {
      const data = [1, 2, 3];
      const tree = buildTreeFromJson(data);

      expect(tree.rootNodes).toHaveLength(1);
      expect(tree.rootNodes[0]?.type).toBe("array");
      expect(tree.rootNodes[0]?.children).toHaveLength(3);
      expect(tree.rootNodes[0]?.children[0]?.key).toBe(0);
      expect(tree.rootNodes[0]?.children[0]?.value).toBe(1);
    });

    it("should build tree with nested objects", () => {
      const data = {
        user: {
          profile: {
            name: "John",
            age: 30,
          },
        },
      };
      const tree = buildTreeFromJson(data);

      expect(tree.rootNodes[0]?.children[0]?.key).toBe("user");
      expect(tree.rootNodes[0]?.children[0]?.type).toBe("object");
      expect(tree.rootNodes[0]?.children[0]?.children[0]?.key).toBe("profile");
      expect(
        tree.rootNodes[0]?.children[0]?.children[0]?.children,
      ).toHaveLength(2);
    });

    it("should handle primitive values", () => {
      const data = "hello";
      const tree = buildTreeFromJson(data);

      expect(tree.rootNodes).toHaveLength(1);
      expect(tree.rootNodes[0]?.type).toBe("primitive");
      expect(tree.rootNodes[0]?.value).toBe("hello");
      expect(tree.rootNodes[0]?.children).toHaveLength(0);
    });

    it("should handle null values", () => {
      const data = null;
      const tree = buildTreeFromJson(data);

      expect(tree.rootNodes).toHaveLength(1);
      expect(tree.rootNodes[0]?.type).toBe("primitive");
      expect(tree.rootNodes[0]?.value).toBe(null);
    });

    it("should expand nodes up to specified level", () => {
      const data = {
        level1: {
          level2: {
            level3: "value",
          },
        },
      };
      const tree = buildTreeFromJson(data, { expandLevel: 2 });

      expect(tree.rootNodes[0]?.isExpanded).toBe(true); // Level 0
      expect(tree.rootNodes[0]?.children[0]?.isExpanded).toBe(true); // Level 1
      expect(tree.rootNodes[0]?.children[0]?.children[0]?.isExpanded).toBe(
        false,
      ); // Level 2
    });
  });

  describe("toggleNodeExpansion", () => {
    it("should toggle node expansion", () => {
      const data = { user: { name: "John" } };
      const tree = buildTreeFromJson(data);
      const userNodeId = tree.rootNodes[0]?.children[0]?.id;
      if (!userNodeId) throw new Error("User node ID not found");

      // Node should be expanded initially
      expect(tree.nodes.get(userNodeId)?.isExpanded).toBe(true);

      // Toggle to collapse
      const collapsed = toggleNodeExpansion(tree, userNodeId);
      expect(collapsed.nodes.get(userNodeId)?.isExpanded).toBe(false);
      expect(collapsed.expandedNodes.has(userNodeId)).toBe(false);

      // Toggle back to expand
      const expanded = toggleNodeExpansion(collapsed, userNodeId);
      expect(expanded.nodes.get(userNodeId)?.isExpanded).toBe(true);
      expect(expanded.expandedNodes.has(userNodeId)).toBe(true);
    });

    it("should not affect primitive nodes", () => {
      const data = { name: "John" };
      const tree = buildTreeFromJson(data);
      const nameNodeId = tree.rootNodes[0]?.children[0]?.id;
      if (!nameNodeId) throw new Error("Name node ID not found");

      const result = toggleNodeExpansion(tree, nameNodeId);
      expect(result).toBe(tree); // Should return same object
    });
  });

  describe("expandAll", () => {
    it("should expand all expandable nodes", () => {
      const data = {
        level1: {
          level2: {
            level3: "value",
          },
        },
      };
      const tree = buildTreeFromJson(data, { expandLevel: 0 });

      // Initially all should be collapsed
      expect(tree.expandedNodes.size).toBe(0);

      const expanded = expandAll(tree);

      // All object nodes should be expanded
      for (const [nodeId, node] of expanded.nodes) {
        if (node.hasChildren) {
          expect(node.isExpanded).toBe(true);
          expect(expanded.expandedNodes.has(nodeId)).toBe(true);
        }
      }
    });
  });

  describe("collapseAll", () => {
    it("should collapse all nodes", () => {
      const data = {
        level1: {
          level2: {
            level3: "value",
          },
        },
      };
      const tree = buildTreeFromJson(data, { expandLevel: 10 });

      // Initially all should be expanded
      expect(tree.expandedNodes.size).toBeGreaterThan(0);

      const collapsed = collapseAll(tree);

      // All nodes should be collapsed
      for (const [, node] of collapsed.nodes) {
        expect(node.isExpanded).toBe(false);
      }
      expect(collapsed.expandedNodes.size).toBe(0);
    });
  });
});
