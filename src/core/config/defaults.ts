/**
 * Default configuration values for jsont application
 */

import type { JsontConfig } from "./types.js";

export const DEFAULT_CONFIG: JsontConfig = {
  keybindings: {
    navigation: {
      up: ["k", "ArrowUp"],
      down: ["j", "ArrowDown"],
      pageUp: ["Ctrl+b", "PageUp"],
      pageDown: ["Ctrl+f", "PageDown"],
      top: ["g"],
      bottom: ["G"],
    },
    modes: {
      search: ["/", "s"],
      schema: ["S"],
      tree: ["T"],
      collapsible: ["C"],
      jq: ["J"],
      lineNumbers: ["L"],
      debug: ["D"],
      help: ["?"],
      export: ["E"],
      quit: ["q"],
    },
    search: {
      next: ["n"],
      previous: ["N"],
      exit: ["Escape"],
    },
  },
  display: {
    json: {
      indent: 2,
      useTabs: false,
      maxLineLength: 80,
    },
    tree: {
      showArrayIndices: true,
      showPrimitiveValues: true,
      maxValueLength: 50,
      useUnicodeTree: true,
      showSchemaTypes: false,
    },
    interface: {
      showLineNumbers: false,
      debugMode: false,
      defaultHeight: 24,
      showStatusBar: true,
    },
  },
  behavior: {
    search: {
      caseSensitive: false,
      regex: false,
      highlight: true,
    },
    navigation: {
      halfPageScroll: true,
      autoScroll: true,
      scrollOffset: 2,
    },
  },
};
