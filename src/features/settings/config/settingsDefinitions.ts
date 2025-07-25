/**
 * Settings categories and field definitions for interactive TUI
 */

import type {
  SettingsCategory,
  SettingsFieldDefinition,
  SettingsSection,
} from "../types/settings";

export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    id: "interface",
    name: "Interface",
    description: "General interface and display settings",
    fields: [
      {
        key: "display.interface.showLineNumbers",
        label: "Show Line Numbers",
        type: "boolean",
        description: "Display line numbers in the left margin",
        defaultValue: false,
      },
      {
        key: "display.interface.debugMode",
        label: "Debug Mode",
        type: "boolean",
        description: "Show debug information bar",
        defaultValue: false,
      },
      {
        key: "display.interface.showStatusBar",
        label: "Show Status Bar",
        type: "boolean",
        description: "Display help status bar at bottom",
        defaultValue: true,
      },
      {
        key: "display.interface.defaultHeight",
        label: "Default Height",
        type: "number",
        description: "Default terminal height when detection fails",
        defaultValue: 24,
        min: 10,
        max: 100,
      },
    ],
  },
  {
    id: "json",
    name: "JSON",
    description: "JSON formatting and display settings",
    fields: [
      {
        key: "display.json.indent",
        label: "JSON Indentation",
        type: "number",
        description: "Number of spaces for JSON indentation",
        defaultValue: 2,
        min: 1,
        max: 8,
      },
      {
        key: "display.json.useTabs",
        label: "Use Tabs",
        type: "boolean",
        description: "Use tabs instead of spaces for indentation",
        defaultValue: false,
      },
      {
        key: "display.json.maxLineLength",
        label: "Max Line Length",
        type: "number",
        description: "Maximum line length before wrapping",
        defaultValue: 80,
        min: 40,
        max: 200,
      },
    ],
  },
  {
    id: "tree",
    name: "Tree",
    description: "Tree navigation and display settings",
    fields: [
      {
        key: "display.tree.showArrayIndices",
        label: "Show Array Indices",
        type: "boolean",
        description: "Display array indices in tree view",
        defaultValue: true,
      },
      {
        key: "display.tree.showPrimitiveValues",
        label: "Show Primitive Values",
        type: "boolean",
        description: "Display primitive values inline in tree view",
        defaultValue: true,
      },
      {
        key: "display.tree.maxValueLength",
        label: "Max Value Length",
        type: "number",
        description: "Maximum length for inline primitive values",
        defaultValue: 50,
        min: 10,
        max: 200,
      },
      {
        key: "display.tree.useUnicodeTree",
        label: "Unicode Tree Lines",
        type: "boolean",
        description: "Use Unicode characters for tree lines",
        defaultValue: true,
      },
      {
        key: "display.tree.showSchemaTypes",
        label: "Show Schema Types",
        type: "boolean",
        description: "Display inferred types in tree view",
        defaultValue: false,
      },
    ],
  },
  {
    id: "keybindings",
    name: "Keybindings",
    description: "Keyboard shortcuts and navigation keys",
    fields: [
      {
        key: "keybindings.navigation.up",
        label: "Move Up",
        type: "array",
        description: "Keys to move cursor up",
        defaultValue: ["k", "ArrowUp"],
      },
      {
        key: "keybindings.navigation.down",
        label: "Move Down",
        type: "array",
        description: "Keys to move cursor down",
        defaultValue: ["j", "ArrowDown"],
      },
      {
        key: "keybindings.navigation.pageUp",
        label: "Page Up",
        type: "array",
        description: "Keys to scroll up by half page",
        defaultValue: ["Ctrl+b", "PageUp"],
      },
      {
        key: "keybindings.navigation.pageDown",
        label: "Page Down",
        type: "array",
        description: "Keys to scroll down by half page",
        defaultValue: ["Ctrl+f", "PageDown"],
      },
      {
        key: "keybindings.navigation.top",
        label: "Go to Top",
        type: "array",
        description: "Keys to jump to first line",
        defaultValue: ["g"],
      },
      {
        key: "keybindings.navigation.bottom",
        label: "Go to Bottom",
        type: "array",
        description: "Keys to jump to last line",
        defaultValue: ["G"],
      },
      {
        key: "keybindings.modes.search",
        label: "Search Mode",
        type: "array",
        description: "Keys to activate search mode",
        defaultValue: ["/", "s"],
      },
      {
        key: "keybindings.modes.schema",
        label: "Schema View",
        type: "array",
        description: "Keys to toggle schema view",
        defaultValue: ["S"],
      },
      {
        key: "keybindings.modes.tree",
        label: "Tree View",
        type: "array",
        description: "Keys to toggle tree view",
        defaultValue: ["T"],
      },
      {
        key: "keybindings.modes.collapsible",
        label: "Collapsible View",
        type: "array",
        description: "Keys to toggle collapsible view",
        defaultValue: ["C"],
      },
      {
        key: "keybindings.modes.jq",
        label: "JQ Mode",
        type: "array",
        description: "Keys to toggle jq transformation mode",
        defaultValue: ["J"],
      },
      {
        key: "keybindings.modes.lineNumbers",
        label: "Line Numbers",
        type: "array",
        description: "Keys to toggle line numbers",
        defaultValue: ["L"],
      },
      {
        key: "keybindings.modes.help",
        label: "Help",
        type: "array",
        description: "Keys to show help screen",
        defaultValue: ["?"],
      },
      {
        key: "keybindings.modes.quit",
        label: "Quit",
        type: "array",
        description: "Keys to quit application",
        defaultValue: ["q"],
      },
    ],
  },
  {
    id: "behavior",
    name: "Behavior",
    description: "Application behavior and performance settings",
    fields: [
      {
        key: "behavior.search.caseSensitive",
        label: "Case Sensitive Search",
        type: "boolean",
        description: "Make search operations case sensitive",
        defaultValue: false,
      },
      {
        key: "behavior.search.regex",
        label: "Regex Search",
        type: "boolean",
        description: "Enable regular expression search by default",
        defaultValue: false,
      },
      {
        key: "behavior.search.highlight",
        label: "Highlight Matches",
        type: "boolean",
        description: "Highlight search matches in results",
        defaultValue: true,
      },
      {
        key: "behavior.navigation.halfPageScroll",
        label: "Half Page Scrolling",
        type: "boolean",
        description: "Use half-page scrolling for Ctrl+f/b",
        defaultValue: true,
      },
      {
        key: "behavior.navigation.autoScroll",
        label: "Auto Scroll",
        type: "boolean",
        description: "Auto scroll to search results",
        defaultValue: true,
      },
      {
        key: "behavior.navigation.scrollOffset",
        label: "Scroll Offset",
        type: "number",
        description: "Lines to keep visible when auto-scrolling",
        defaultValue: 2,
        min: 0,
        max: 10,
      },
    ],
  },
];

/**
 * Get category by ID
 */
export function getCategoryById(id: string): SettingsCategory | undefined {
  return SETTINGS_CATEGORIES.find((cat) => cat.id === id);
}

/**
 * Get field definition by key
 */
export function getFieldByKey(
  key: string,
): { category: SettingsCategory; field: SettingsFieldDefinition } | undefined {
  for (const category of SETTINGS_CATEGORIES) {
    const field = category.fields.find((f) => f.key === key);
    if (field) {
      return { category, field };
    }
  }
  return undefined;
}

// Improved UX: Grouped sections for better organization
export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "interface",
    name: "Interface",
    icon: "🖥️",
    description: "General interface and display settings",
    fields: [
      {
        key: "display.interface.showLineNumbers",
        label: "Line Numbers",
        type: "boolean",
        description: "Show line numbers in the left margin",
        defaultValue: false,
      },
      {
        key: "display.interface.debugMode",
        label: "Debug Mode",
        type: "boolean",
        description: "Show debug information bar",
        defaultValue: false,
      },
      {
        key: "display.interface.showStatusBar",
        label: "Status Bar",
        type: "boolean",
        description: "Show help status bar at bottom",
        defaultValue: true,
      },
      {
        key: "display.interface.defaultHeight",
        label: "Terminal Height",
        type: "number",
        description: "Default height when detection fails",
        defaultValue: 24,
        min: 10,
        max: 100,
      },
    ],
  },
  {
    id: "navigation",
    name: "Navigation",
    icon: "⌨️",
    description: "Keyboard shortcuts and movement",
    fields: [
      {
        key: "keybindings.navigation.up",
        label: "Move Up",
        type: "array",
        description: "Keys to move cursor up",
        defaultValue: ["k", "ArrowUp"],
      },
      {
        key: "keybindings.navigation.down",
        label: "Move Down",
        type: "array",
        description: "Keys to move cursor down",
        defaultValue: ["j", "ArrowDown"],
      },
      {
        key: "keybindings.navigation.pageUp",
        label: "Page Up",
        type: "array",
        description: "Keys to scroll up by half page",
        defaultValue: ["Ctrl+b", "PageUp"],
      },
      {
        key: "keybindings.navigation.pageDown",
        label: "Page Down",
        type: "array",
        description: "Keys to scroll down by half page",
        defaultValue: ["Ctrl+f", "PageDown"],
      },
    ],
  },
];

/**
 * Get section by ID
 */
export function getSectionById(id: string): SettingsSection | undefined {
  return SETTINGS_SECTIONS.find((section) => section.id === id);
}
