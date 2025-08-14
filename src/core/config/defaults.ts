/**
 * Default configuration values for jsont application
 */

import type { JsontConfig } from "./types";

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
      exportData: ["Shift+E"],
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
      appearance: {
        borders: {
          style: "single",
          colors: {
            mainContent: "gray",
            search: "yellow",
            jq: "blue",
            settings: {
              normal: "cyan",
              editing: "yellow",
            },
            help: "cyan",
            debug: "blue",
            propertyDetails: "gray",
            export: "yellow",
          },
        },
        colors: {
          primary: "cyan",
          secondary: "yellow",
          success: "green",
          warning: "yellow",
          error: "red",
          info: "blue",
          muted: "gray",
          text: {
            primary: "white",
            secondary: "gray",
            dimmed: "gray",
          },
        },
        heights: {
          searchBar: 3,
          jqInput: 7,
          propertyDetails: 9,
          settingsHeader: 4,
        },
      },
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
