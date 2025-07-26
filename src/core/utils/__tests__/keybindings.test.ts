/**
 * Tests for keybinding utilities
 */

import type { KeyBindings } from "../../config/types.js";
import {
  createKeybindingMatcher,
  type KeyboardInput,
  matchesKeybinding,
} from "../keybindings.js";

describe("Keybinding Utilities", () => {
  const testKeybindings: KeyBindings = {
    navigation: {
      up: ["k", "ArrowUp"],
      down: ["j", "ArrowDown"],
      pageUp: ["Ctrl+b", "PageUp"],
      pageDown: ["Ctrl+f", "PageDown"],
      top: ["g"],
      bottom: ["G"],
    },
    modes: {
      search: ["/"],
      schema: ["S"],
      tree: ["T"],
      collapsible: ["C"],
      jq: ["J"],
      lineNumbers: ["L"],
      debug: ["D"],
      help: ["?"],
      export: ["E"],
      exportData: ["Shift+E"],
      quit: ["q"],
    },
    search: {
      next: ["n"],
      previous: ["N"],
      exit: ["Escape"],
    },
  };

  describe("matchesKeybinding", () => {
    it("should match simple key bindings", () => {
      const key: KeyboardInput = { ctrl: false };

      expect(matchesKeybinding("k", key, ["k", "ArrowUp"])).toBe(true);
      expect(matchesKeybinding("j", key, ["k", "ArrowUp"])).toBe(false);
    });

    it("should match arrow key bindings", () => {
      const upKey: KeyboardInput = { ctrl: false, upArrow: true };
      const downKey: KeyboardInput = { ctrl: false, downArrow: true };

      expect(matchesKeybinding("", upKey, ["k", "ArrowUp"])).toBe(true);
      expect(matchesKeybinding("", downKey, ["k", "ArrowUp"])).toBe(false);
    });

    it("should match control key combinations", () => {
      const ctrlF: KeyboardInput = { ctrl: true };
      const regularF: KeyboardInput = { ctrl: false };

      expect(matchesKeybinding("f", ctrlF, ["Ctrl+f", "PageDown"])).toBe(true);
      expect(matchesKeybinding("f", regularF, ["Ctrl+f", "PageDown"])).toBe(
        false,
      );
    });

    it("should match special keys", () => {
      const escapeKey: KeyboardInput = { ctrl: false, escape: true };
      const returnKey: KeyboardInput = { ctrl: false, return: true };

      expect(matchesKeybinding("", escapeKey, ["Escape"])).toBe(true);
      expect(matchesKeybinding("", returnKey, ["Escape"])).toBe(false);
    });
  });

  describe("KeybindingMatcher", () => {
    let matcher: ReturnType<typeof createKeybindingMatcher>;

    beforeEach(() => {
      matcher = createKeybindingMatcher(testKeybindings);
    });

    describe("navigation methods", () => {
      it("should correctly identify up navigation", () => {
        expect(matcher.isUp("k", { ctrl: false })).toBe(true);
        expect(matcher.isUp("", { ctrl: false, upArrow: true })).toBe(true);
        expect(matcher.isUp("j", { ctrl: false })).toBe(false);
      });

      it("should correctly identify down navigation", () => {
        expect(matcher.isDown("j", { ctrl: false })).toBe(true);
        expect(matcher.isDown("", { ctrl: false, downArrow: true })).toBe(true);
        expect(matcher.isDown("k", { ctrl: false })).toBe(false);
      });

      it("should correctly identify page navigation", () => {
        expect(matcher.isPageUp("b", { ctrl: true })).toBe(true);
        expect(matcher.isPageDown("f", { ctrl: true })).toBe(true);
        expect(matcher.isPageUp("f", { ctrl: true })).toBe(false);
      });

      it("should correctly identify top/bottom navigation", () => {
        expect(matcher.isTop("g", { ctrl: false })).toBe(true);
        expect(matcher.isBottom("G", { ctrl: false })).toBe(true);
        expect(matcher.isTop("G", { ctrl: false })).toBe(false);
      });
    });

    describe("mode methods", () => {
      it("should correctly identify mode toggles", () => {
        expect(matcher.isSearch("/", { ctrl: false })).toBe(true);
        expect(matcher.isSchema("S", { ctrl: false })).toBe(true);
        expect(matcher.isTree("T", { ctrl: false })).toBe(true);
        expect(matcher.isCollapsible("C", { ctrl: false })).toBe(true);
        expect(matcher.isJq("J", { ctrl: false })).toBe(true);
        expect(matcher.isLineNumbers("L", { ctrl: false })).toBe(true);
        expect(matcher.isDebug("D", { ctrl: false })).toBe(true);
        expect(matcher.isHelp("?", { ctrl: false })).toBe(true);
        expect(matcher.isExport("E", { ctrl: false })).toBe(true);
        expect(matcher.isExportData("E", { ctrl: false, shift: true })).toBe(
          true,
        );
        expect(matcher.isQuit("q", { ctrl: false })).toBe(true);
      });

      it("should not match incorrect mode keys", () => {
        expect(matcher.isSearch("s", { ctrl: false })).toBe(false);
        expect(matcher.isSchema("s", { ctrl: false })).toBe(false);
      });
    });

    describe("search methods", () => {
      it("should correctly identify search navigation", () => {
        expect(matcher.isSearchNext("n", { ctrl: false })).toBe(true);
        expect(matcher.isSearchPrevious("N", { ctrl: false })).toBe(true);
        expect(matcher.isSearchExit("", { ctrl: false, escape: true })).toBe(
          true,
        );
      });

      it("should not match incorrect search keys", () => {
        expect(matcher.isSearchNext("N", { ctrl: false })).toBe(false);
        expect(matcher.isSearchPrevious("n", { ctrl: false })).toBe(false);
      });
    });
  });

  describe("createKeybindingMatcher", () => {
    it("should create a working matcher instance", () => {
      const matcher = createKeybindingMatcher(testKeybindings);
      expect(matcher).toBeDefined();
      expect(typeof matcher.isUp).toBe("function");
      expect(typeof matcher.isDown).toBe("function");
    });
  });
});
