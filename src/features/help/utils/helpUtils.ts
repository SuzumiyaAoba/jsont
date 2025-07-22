/**
 * Help system utilities
 */

import type { AppMode } from "@core/types/app";
import type {
  HelpContent,
  HelpSection,
  HelpShortcut,
  HelpState,
} from "../types/help";

/**
 * Get comprehensive help content for a specific mode
 */
export function getHelpContentForMode(mode: AppMode): HelpContent {
  const commonSections = getCommonHelpSections();
  const modeSpecificSections = getModeSpecificHelpSections(mode);

  return {
    mode,
    sections: [...commonSections, ...modeSpecificSections],
  };
}

/**
 * Get help sections that are common across all modes
 */
function getCommonHelpSections(): HelpSection[] {
  return [
    {
      title: "Mode Switching",
      shortcuts: [
        { key: "T", description: "Toggle Tree View mode", category: "mode" },
        { key: "/", description: "Start Search mode", category: "mode" },
        { key: "J", description: "Toggle jq Filter mode", category: "mode" },
        { key: "C", description: "Toggle Collapsible mode", category: "mode" },
        { key: "S", description: "Toggle Schema view", category: "mode" },
        { key: "D", description: "Toggle Debug Log Viewer", category: "mode" },
      ],
    },
    {
      title: "Global Controls",
      shortcuts: [
        { key: "?", description: "Toggle this help", category: "global" },
        { key: "q", description: "Quit application", category: "global" },
        { key: "Ctrl+C", description: "Exit application", category: "global" },
        { key: "E", description: "Export JSON Schema", category: "global" },
        { key: "L", description: "Toggle line numbers", category: "global" },
      ],
    },
  ];
}

/**
 * Get help sections specific to a mode
 */
function getModeSpecificHelpSections(mode: AppMode): HelpSection[] {
  switch (mode) {
    case "tree":
      return [
        {
          title: "Tree Navigation",
          shortcuts: [
            { key: "j / ↓", description: "Move down", category: "navigation" },
            { key: "k / ↑", description: "Move up", category: "navigation" },
            {
              key: "Ctrl+b",
              description: "Page up",
              category: "navigation",
            },
            {
              key: "Ctrl+f",
              description: "Page down",
              category: "navigation",
            },
            {
              key: "g",
              description: "Go to first item",
              category: "navigation",
            },
            {
              key: "G",
              description: "Go to last item",
              category: "navigation",
            },
          ],
        },
        {
          title: "Tree Operations",
          shortcuts: [
            {
              key: "Space / Enter",
              description: "Toggle node expansion",
              category: "operation",
            },
            {
              key: "e",
              description: "Expand all nodes",
              category: "operation",
            },
            {
              key: "c",
              description: "Collapse all nodes",
              category: "operation",
            },
            {
              key: "t",
              description: "Toggle schema type display",
              category: "display",
            },
            {
              key: "L",
              description: "Toggle line numbers",
              category: "display",
            },
          ],
        },
      ];

    case "search":
      return [
        {
          title: "Search Operations",
          shortcuts: [
            {
              key: "Enter",
              description: "Confirm search",
              category: "search",
            },
            {
              key: "Esc",
              description: "Exit search mode",
              category: "search",
            },
            {
              key: "Tab",
              description: "Change search scope",
              category: "search",
            },
            {
              key: "n",
              description: "Go to next result",
              category: "navigation",
            },
            {
              key: "N",
              description: "Go to previous result",
              category: "navigation",
            },
            { key: "/", description: "Start new search", category: "search" },
            {
              key: "q",
              description: "Return to search input",
              category: "search",
            },
          ],
        },
        {
          title: "Text Input",
          shortcuts: [
            {
              key: "Ctrl+A",
              description: "Move to beginning",
              category: "editing",
            },
            { key: "Ctrl+E", description: "Move to end", category: "editing" },
            {
              key: "Ctrl+K",
              description: "Delete to end",
              category: "editing",
            },
            {
              key: "Ctrl+U",
              description: "Delete to beginning",
              category: "editing",
            },
            {
              key: "Ctrl+W",
              description: "Delete word backward",
              category: "editing",
            },
            {
              key: "←/→",
              description: "Move cursor left/right",
              category: "editing",
            },
          ],
        },
      ];

    case "filter":
      return [
        {
          title: "jq Filter Operations",
          shortcuts: [
            {
              key: "Enter",
              description: "Apply jq filter",
              category: "filter",
            },
            { key: "Esc", description: "Exit jq mode", category: "filter" },
            { key: "J", description: "Exit jq mode", category: "filter" },
            {
              key: "Tab",
              description: "Switch between input/output",
              category: "filter",
            },
          ],
        },
        {
          title: "Text Input",
          shortcuts: [
            {
              key: "Ctrl+A",
              description: "Move to beginning",
              category: "editing",
            },
            { key: "Ctrl+E", description: "Move to end", category: "editing" },
            {
              key: "Ctrl+K",
              description: "Delete to end",
              category: "editing",
            },
            {
              key: "Ctrl+U",
              description: "Delete to beginning",
              category: "editing",
            },
            {
              key: "Ctrl+W",
              description: "Delete word backward",
              category: "editing",
            },
            {
              key: "←/→",
              description: "Move cursor left/right",
              category: "editing",
            },
          ],
        },
        {
          title: "JSON Result Navigation",
          shortcuts: [
            {
              key: "j/k",
              description: "Scroll up/down",
              category: "navigation",
            },
            { key: "Ctrl+f", description: "Page down", category: "navigation" },
            { key: "Ctrl+b", description: "Page up", category: "navigation" },
            { key: "gg", description: "Go to top", category: "navigation" },
            { key: "G", description: "Go to bottom", category: "navigation" },
            { key: "i", description: "Return to input mode", category: "mode" },
            {
              key: "o",
              description: "Toggle original/result",
              category: "display",
            },
          ],
        },
        {
          title: "Error Navigation",
          shortcuts: [
            {
              key: "Shift+↑",
              description: "Scroll error up",
              category: "error",
            },
            {
              key: "Shift+↓",
              description: "Scroll error down",
              category: "error",
            },
          ],
        },
      ];

    case "collapsible":
      return [
        {
          title: "Collapsible View Navigation",
          shortcuts: [
            {
              key: "j / ↓",
              description: "Move cursor down",
              category: "navigation",
            },
            {
              key: "k / ↑",
              description: "Move cursor up",
              category: "navigation",
            },
            {
              key: "Ctrl+f",
              description: "Page down",
              category: "navigation",
            },
            {
              key: "Ctrl+b",
              description: "Page up",
              category: "navigation",
            },
            { key: "gg", description: "Go to top", category: "navigation" },
            { key: "G", description: "Go to bottom", category: "navigation" },
          ],
        },
        {
          title: "Collapsible Operations",
          shortcuts: [
            {
              key: "Space/Enter",
              description: "Toggle node",
              category: "operation",
            },
            { key: "o", description: "Expand node", category: "operation" },
            { key: "c", description: "Collapse node", category: "operation" },
            { key: "O", description: "Expand all", category: "operation" },
          ],
        },
      ];

    case "schema":
      return [
        {
          title: "Schema View Navigation",
          shortcuts: [
            {
              key: "j",
              description: "Scroll down",
              category: "navigation",
            },
            { key: "k", description: "Scroll up", category: "navigation" },
            {
              key: "Ctrl+f",
              description: "Page down",
              category: "navigation",
            },
            {
              key: "Ctrl+b",
              description: "Page up",
              category: "navigation",
            },
            { key: "gg", description: "Go to top", category: "navigation" },
            { key: "G", description: "Go to bottom", category: "navigation" },
          ],
        },
        {
          title: "Schema Operations",
          shortcuts: [
            { key: "E", description: "Export schema", category: "operation" },
          ],
        },
      ];

    case "raw":
      return [
        {
          title: "Raw View Navigation",
          shortcuts: [
            {
              key: "j",
              description: "Scroll down",
              category: "navigation",
            },
            { key: "k", description: "Scroll up", category: "navigation" },
            {
              key: "Ctrl+f",
              description: "Page down",
              category: "navigation",
            },
            {
              key: "Ctrl+b",
              description: "Page up",
              category: "navigation",
            },
            { key: "gg", description: "Go to top", category: "navigation" },
            { key: "G", description: "Go to bottom", category: "navigation" },
          ],
        },
      ];

    default:
      return [];
  }
}

/**
 * Get a quick reference help text for status bar
 */
export function getQuickHelpText(mode: AppMode): string {
  const quickHelp: Record<AppMode, string> = {
    tree: "j/k: move, Space: toggle, e/c: expand/collapse all, ?: help",
    search: "Enter: search, n/N: next/prev, Tab: scope, /: new search, ?: help",
    filter: "Enter: apply, Tab: switch, i: input, o: toggle view, ?: help",
    collapsible:
      "j/k: move, Space: toggle, o/c: expand/collapse, O: all, ?: help",
    schema: "j/k: scroll, Ctrl+f/b: page, E: export, ?: help",
    raw: "j/k: scroll, Ctrl+f/b: page, gg/G: top/bottom, ?: help",
  };

  return quickHelp[mode] || "?: help";
}

/**
 * Get shortcuts for a specific category
 */
export function getShortcutsByCategory(
  content: HelpContent,
  category: string,
): HelpShortcut[] {
  const shortcuts: HelpShortcut[] = [];

  for (const section of content.sections) {
    for (const shortcut of section.shortcuts) {
      if (shortcut.category === category) {
        shortcuts.push(shortcut);
      }
    }
  }

  return shortcuts;
}

/**
 * Initial help state
 */
export function createInitialHelpState(mode: AppMode): HelpState {
  return {
    visible: false,
    currentMode: mode,
  };
}

/**
 * Check if a key combination should trigger help
 */
export function isHelpKey(
  input: string,
  key?: { ctrl?: boolean; meta?: boolean; shift?: boolean },
): boolean {
  return input === "?" && !key?.ctrl && !key?.meta && !key?.shift;
}

/**
 * Format a help shortcut for display
 */
export function formatShortcut(shortcut: HelpShortcut): string {
  return `${shortcut.key.padEnd(20)} ${shortcut.description}`;
}

/**
 * Get all available modes for mode switching help
 */
export function getAvailableModes(): Array<{
  key: string;
  mode: AppMode;
  description: string;
}> {
  return [
    {
      key: "T",
      mode: "tree",
      description: "Tree View - Hierarchical JSON structure",
    },
    { key: "/", mode: "search", description: "Search - Find content in JSON" },
    {
      key: "J",
      mode: "filter",
      description: "jq Filter - Apply jq expressions",
    },
    {
      key: "C",
      mode: "collapsible",
      description: "Collapsible - Interactive JSON tree",
    },
    {
      key: "S",
      mode: "schema",
      description: "Schema View - JSON Schema visualization",
    },
    { key: "", mode: "raw", description: "Raw View - Simple scrollable JSON" },
  ];
}
