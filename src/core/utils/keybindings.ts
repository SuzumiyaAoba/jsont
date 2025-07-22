/**
 * Keyboard binding utilities for jsont application
 * Provides utilities to check if keyboard input matches configured keybindings
 */

import type { KeyBindings } from "../config/types.js";

export interface KeyboardInput {
  ctrl: boolean;
  meta?: boolean;
  shift?: boolean;
  return?: boolean;
  escape?: boolean;
  backspace?: boolean;
  delete?: boolean;
  tab?: boolean;
  upArrow?: boolean;
  downArrow?: boolean;
  leftArrow?: boolean;
  rightArrow?: boolean;
  pageUp?: boolean;
  pageDown?: boolean;
}

/**
 * Convert Ink keyboard input to a normalized key string
 */
function normalizeKey(input: string, key: KeyboardInput): string {
  // Handle special keys first
  if (key.return) return "Return";
  if (key.escape) return "Escape";
  if (key.backspace) return "Backspace";
  if (key.delete) return "Delete";
  if (key.tab) return "Tab";
  if (key.upArrow) return "ArrowUp";
  if (key.downArrow) return "ArrowDown";
  if (key.leftArrow) return "ArrowLeft";
  if (key.rightArrow) return "ArrowRight";
  if (key.pageUp) return "PageUp";
  if (key.pageDown) return "PageDown";

  // Handle modified keys
  const modifiers: string[] = [];
  if (key.ctrl) modifiers.push("Ctrl");
  if (key.meta) modifiers.push("Meta");
  if (key.shift) modifiers.push("Shift");

  if (modifiers.length > 0) {
    return `${modifiers.join("+")}+${input}`;
  }

  return input;
}

/**
 * Check if a keyboard input matches any of the configured bindings for an action
 */
export function matchesKeybinding(
  input: string,
  key: KeyboardInput,
  bindings: string[],
): boolean {
  const normalizedKey = normalizeKey(input, key);
  return bindings.includes(normalizedKey);
}

/**
 * Keybinding matcher utility class
 */
export class KeybindingMatcher {
  constructor(private readonly keybindings: KeyBindings) {}

  // Navigation bindings
  isUp(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.navigation.up);
  }

  isDown(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.navigation.down);
  }

  isPageUp(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.navigation.pageUp);
  }

  isPageDown(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.navigation.pageDown);
  }

  isTop(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.navigation.top);
  }

  isBottom(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.navigation.bottom);
  }

  // Mode bindings
  isSearch(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.modes.search);
  }

  isSchema(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.modes.schema);
  }

  isTree(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.modes.tree);
  }

  isCollapsible(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.modes.collapsible);
  }

  isJq(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.modes.jq);
  }

  isLineNumbers(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.modes.lineNumbers);
  }

  isDebug(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.modes.debug);
  }

  isHelp(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.modes.help);
  }

  isExport(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.modes.export);
  }

  isQuit(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.modes.quit);
  }

  // Search bindings
  isSearchNext(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.search.next);
  }

  isSearchPrevious(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.search.previous);
  }

  isSearchExit(input: string, key: KeyboardInput): boolean {
    return matchesKeybinding(input, key, this.keybindings.search.exit);
  }
}

/**
 * Create a keybinding matcher from configuration
 */
export function createKeybindingMatcher(
  keybindings: KeyBindings,
): KeybindingMatcher {
  return new KeybindingMatcher(keybindings);
}
