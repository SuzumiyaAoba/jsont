import {
  buildJsonTree,
  flattenNodes,
  formatCollapsedNode,
  generateNodeId,
  getNodeDisplayText,
  getValueType,
  handleNavigation,
  initializeCollapsibleState,
  isCollapsible,
} from "@features/collapsible/utils/collapsibleJson.js";
import { describe, expect, it } from "vitest";

describe("collapsibleJson", () => {
  const testData = {
    name: "John",
    age: 30,
    address: {
      street: "123 Main St",
      city: "New York",
    },
    hobbies: ["reading", "coding"],
  };

  describe("generateNodeId", () => {
    it("should generate correct node IDs", () => {
      expect(generateNodeId([])).toBe("root");
      expect(generateNodeId(["name"])).toBe("name");
      expect(generateNodeId(["address", "street"])).toBe("address.street");
    });
  });

  describe("getValueType", () => {
    it("should correctly identify value types", () => {
      expect(getValueType("string")).toBe("primitive");
      expect(getValueType(123)).toBe("primitive");
      expect(getValueType(null)).toBe("primitive");
      expect(getValueType({})).toBe("object");
      expect(getValueType([])).toBe("array");
    });
  });

  describe("isCollapsible", () => {
    it("should correctly identify collapsible values", () => {
      expect(isCollapsible("string")).toBe(false);
      expect(isCollapsible(123)).toBe(false);
      expect(isCollapsible({})).toBe(false); // empty object
      expect(isCollapsible([])).toBe(false); // empty array
      expect(isCollapsible({ key: "value" })).toBe(true);
      expect(isCollapsible(["item"])).toBe(true);
    });
  });

  describe("buildJsonTree", () => {
    it("should build correct tree structure", () => {
      const tree = buildJsonTree(testData);

      expect(tree.id).toBe("root");
      expect(tree.type).toBe("object");
      expect(tree.isCollapsible).toBe(true);
      expect(tree.children).toHaveLength(4);

      // Check name property
      const nameNode = tree.children?.find(
        (child) => child.path.key === "name",
      );
      expect(nameNode?.type).toBe("primitive");
      expect(nameNode?.value).toBe("John");
      expect(nameNode?.isCollapsible).toBe(false);

      // Check address property
      const addressNode = tree.children?.find(
        (child) => child.path.key === "address",
      );
      expect(addressNode?.type).toBe("object");
      expect(addressNode?.isCollapsible).toBe(true);
      expect(addressNode?.children).toHaveLength(2);
    });
  });

  describe("initializeCollapsibleState", () => {
    it("should initialize state with all nodes expanded", () => {
      const state = initializeCollapsibleState(testData);

      expect(state.nodes.size).toBeGreaterThan(1);
      expect(state.expandedNodes.size).toBeGreaterThan(0);
      expect(state.cursorPosition).not.toBeNull();
      expect(state.flattenedNodes.length).toBeGreaterThan(1);
    });
  });

  describe("flattenNodes", () => {
    it("should flatten expanded nodes correctly", () => {
      const tree = buildJsonTree(testData);
      const expandedNodes = new Set(["root", "address"]);
      const flattened = flattenNodes(tree, expandedNodes);

      // Should include root, its children, and address children
      expect(flattened.length).toBeGreaterThan(4);

      // Check that closing brackets are included
      const closingNodes = flattened.filter((node) =>
        node.id.endsWith("_closing"),
      );
      expect(closingNodes.length).toBeGreaterThan(0);
    });

    it("should respect collapsed state", () => {
      const tree = buildJsonTree(testData);
      const expandedNodes = new Set(["root"]); // Only root expanded
      const flattened = flattenNodes(tree, expandedNodes);

      // Should only show root's direct children, not nested ones
      const addressChildren = flattened.filter(
        (node) => node.path.path.length > 1 && node.path.path[0] === "address",
      );
      expect(addressChildren.length).toBe(0); // Address should be collapsed
    });
  });

  describe("handleNavigation", () => {
    it("should handle move_down action", () => {
      const state = initializeCollapsibleState(testData);
      const result = handleNavigation(state, { type: "move_down" });

      if (result.newState.cursorPosition && state.cursorPosition) {
        expect(result.newState.cursorPosition.lineIndex).toBeGreaterThanOrEqual(
          state.cursorPosition.lineIndex,
        );
      }
    });

    it("should handle move_up action", () => {
      const state = initializeCollapsibleState(testData);
      // First move down, then test move up
      const downResult = handleNavigation(state, { type: "move_down" });
      const upResult = handleNavigation(downResult.newState, {
        type: "move_up",
      });

      if (
        upResult.newState.cursorPosition &&
        downResult.newState.cursorPosition
      ) {
        expect(upResult.newState.cursorPosition.lineIndex).toBeLessThanOrEqual(
          downResult.newState.cursorPosition.lineIndex,
        );
      }
    });

    it("should handle toggle_node action", () => {
      const state = initializeCollapsibleState(testData);

      // Find a collapsible node
      const collapsibleNode = Array.from(state.nodes.values()).find(
        (node) => node.isCollapsible,
      );
      if (collapsibleNode) {
        // Position cursor on the collapsible node
        state.cursorPosition = { nodeId: collapsibleNode.id, lineIndex: 0 };

        const result = handleNavigation(state, { type: "toggle_node" });

        // Node should be collapsed now
        expect(result.newState.expandedNodes.has(collapsibleNode.id)).toBe(
          false,
        );
      }
    });

    it("should provide scroll adjustment for height changes", () => {
      const state = initializeCollapsibleState(testData);

      // Find a collapsible node and position cursor on it
      const collapsibleNode = Array.from(state.nodes.values()).find(
        (node) => node.isCollapsible,
      );
      if (collapsibleNode) {
        state.cursorPosition = { nodeId: collapsibleNode.id, lineIndex: 5 };

        const result = handleNavigation(state, { type: "toggle_node" });

        // Should provide scroll line when height changes
        expect(result.scrollToLine).toBeDefined();
        expect(typeof result.scrollToLine).toBe("number");
      }
    });

    it("should handle cursor position when node becomes invisible", () => {
      const complexData = {
        root: {
          child1: { nested: "value1" },
          child2: { nested: "value2" },
        },
      };
      const state = initializeCollapsibleState(complexData);

      // Position cursor on a nested node
      const nestedNode = Array.from(state.nodes.values()).find(
        (node) => node.path.path.length > 1,
      );
      if (nestedNode) {
        state.cursorPosition = { nodeId: nestedNode.id, lineIndex: 3 };

        // Collapse the parent to make nested node invisible
        const parentNode = nestedNode.parent;
        if (parentNode) {
          state.cursorPosition = { nodeId: parentNode.id, lineIndex: 2 };
          const result = handleNavigation(state, { type: "toggle_node" });

          // Cursor should be moved to a visible node
          expect(result.newState.cursorPosition).toBeTruthy();
          if (result.newState.cursorPosition) {
            const cursorNode = result.newState.nodes.get(
              result.newState.cursorPosition.nodeId,
            );
            expect(cursorNode).toBeTruthy();
          }
        }
      }
    });
  });

  describe("formatCollapsedNode", () => {
    it("should format collapsed nodes correctly", () => {
      const objectNode = buildJsonTree({ a: 1, b: 2 });
      const arrayNode = buildJsonTree([1, 2, 3]);

      expect(formatCollapsedNode(objectNode)).toBe("{...}");
      expect(formatCollapsedNode(arrayNode)).toBe("[...]");

      const primitiveNode = buildJsonTree("string");
      expect(formatCollapsedNode(primitiveNode)).toBe("");
    });
  });

  describe("getNodeDisplayText", () => {
    it("should generate correct display text for expanded nodes", () => {
      const tree = buildJsonTree(testData);
      const displayText = getNodeDisplayText(tree, true);

      expect(displayText).toBe("{"); // Root object opening
    });

    it("should generate correct display text for collapsed nodes", () => {
      const tree = buildJsonTree(testData);
      const displayText = getNodeDisplayText(tree, false);

      expect(displayText).toBe("{...}"); // Collapsed object
    });

    it("should generate correct display text for primitive values", () => {
      const tree = buildJsonTree(testData);
      const nameNode = tree.children?.find(
        (child) => child.path.key === "name",
      );

      if (nameNode) {
        const displayText = getNodeDisplayText(nameNode, true);
        expect(displayText).toContain('"name": "John"');
      }
    });

    it("should handle closing bracket nodes", () => {
      const closingNode = {
        id: "test_closing",
        path: { type: "object" as const, path: [] },
        value: "}",
        type: "primitive" as const,
        level: 0,
        isCollapsible: false,
        isCollapsed: false,
      };

      const displayText = getNodeDisplayText(closingNode, true);
      expect(displayText).toBe("}");
    });

    it("should add commas for non-last elements", () => {
      const tree = buildJsonTree({ a: 1, b: 2, c: 3 });

      if (tree.children) {
        // First element should have comma
        const firstChild = tree.children[0];
        if (firstChild) {
          const displayText = getNodeDisplayText(firstChild, true);
          expect(displayText).toBe('  "a": 1,'); // Standard indentation
        }

        // Last element should not have comma
        const lastChild = tree.children[tree.children.length - 1];
        if (lastChild) {
          const displayText = getNodeDisplayText(lastChild, true);
          expect(displayText).toBe('  "c": 3'); // Standard indentation
        }
      }
    });

    it("should handle commas in arrays correctly", () => {
      const tree = buildJsonTree([1, 2, 3]);

      if (tree.children) {
        // First element should have comma
        const firstChild = tree.children[0];
        if (firstChild) {
          const displayText = getNodeDisplayText(firstChild, true);
          expect(displayText).toBe("  1,"); // Standard indentation
        }

        // Last element should not have comma
        const lastChild = tree.children[tree.children.length - 1];
        if (lastChild) {
          const displayText = getNodeDisplayText(lastChild, true);
          expect(displayText).toBe("  3"); // Standard indentation
        }
      }
    });

    it("should handle comma placement correctly for closing brackets", () => {
      const nestedData = {
        first: { a: 1, b: 2 },
        second: [1, 2, 3],
        third: "value",
      };

      const state = initializeCollapsibleState(nestedData);
      const flattenedNodes = state.flattenedNodes;

      // Find closing bracket for first object
      const firstClosingNode = flattenedNodes.find(
        (node) => node.id === "first_closing",
      );

      if (firstClosingNode) {
        // Should have comma since it's not the last element
        expect(getNodeDisplayText(firstClosingNode, false)).toBe("  },");
      }

      // Find closing bracket for second array
      const secondClosingNode = flattenedNodes.find(
        (node) => node.id === "second_closing",
      );

      if (secondClosingNode) {
        // Should have comma since it's not the last element
        expect(getNodeDisplayText(secondClosingNode, false)).toBe("  ],");
      }

      // Find last element (third)
      const thirdNode = flattenedNodes.find(
        (node) => node.path.key === "third",
      );

      if (thirdNode) {
        // Should NOT have comma since it's the last element
        expect(getNodeDisplayText(thirdNode, false)).toBe('  "third": "value"'); // Standard indentation
      }
    });
  });
});
