/**
 * Help system utilities
 */

import type { KeyBindings } from "@core/config/types";
import type { AppMode } from "@core/types/app";
import type {
  HelpContent,
  HelpSection,
  HelpShortcut,
  HelpState,
} from "../types/help";

/**
 * Get the primary key for display (first key in the array)
 */
function getPrimaryKey(keys: string[]): string {
  return keys[0] || "?";
}

/**
 * Format key combinations for display
 */
function formatKeyForDisplay(keys: string[]): string {
  const primary = getPrimaryKey(keys);
  if (keys.length > 1) {
    return `${primary} (${keys.slice(1).join(", ")})`;
  }
  return primary;
}

/**
 * Get comprehensive help content for a specific mode
 */
export function getHelpContentForMode(
  mode: AppMode,
  keybindings: KeyBindings,
): HelpContent {
  const commonSections = getCommonHelpSections(keybindings);
  const modeSpecificSections = getModeSpecificHelpSections(mode, keybindings);

  return {
    mode,
    sections: [...commonSections, ...modeSpecificSections],
  };
}

/**
 * Get help sections that are common across all modes
 */
function getCommonHelpSections(keybindings: KeyBindings): HelpSection[] {
  return [
    {
      title: "Mode Switching",
      shortcuts: [
        {
          key: formatKeyForDisplay(keybindings.modes.tree),
          description: "Toggle Tree View mode",
          category: "mode",
        },
        {
          key: formatKeyForDisplay(keybindings.modes.search),
          description: "Start Search mode",
          category: "mode",
        },
        {
          key: formatKeyForDisplay(keybindings.modes.jq),
          description: "Toggle jq Filter mode",
          category: "mode",
        },
        {
          key: formatKeyForDisplay(keybindings.modes.collapsible),
          description: "Toggle Collapsible mode",
          category: "mode",
        },
        {
          key: formatKeyForDisplay(keybindings.modes.schema),
          description: "Toggle Schema view",
          category: "mode",
        },
        {
          key: formatKeyForDisplay(keybindings.modes.debug),
          description: "Toggle Debug Log Viewer",
          category: "mode",
        },
      ],
    },
    {
      title: "Global Controls",
      shortcuts: [
        {
          key: formatKeyForDisplay(keybindings.modes.help),
          description: "Toggle this help",
          category: "global",
        },
        {
          key: formatKeyForDisplay(keybindings.modes.quit),
          description: "Quit application",
          category: "global",
        },
        { key: "Ctrl+C", description: "Exit application", category: "global" },
        {
          key: formatKeyForDisplay(keybindings.modes.export),
          description: "Export JSON Schema",
          category: "global",
        },
        {
          key: formatKeyForDisplay(keybindings.modes.lineNumbers),
          description: "Toggle line numbers",
          category: "global",
        },
      ],
    },
  ];
}

/**
 * Get help sections specific to a mode
 */
function getModeSpecificHelpSections(
  mode: AppMode,
  keybindings: KeyBindings,
): HelpSection[] {
  switch (mode) {
    case "tree":
      return [
        {
          title: "Tree Navigation",
          shortcuts: [
            {
              key: formatKeyForDisplay(keybindings.navigation.down),
              description: "Move down",
              category: "navigation",
            },
            {
              key: formatKeyForDisplay(keybindings.navigation.up),
              description: "Move up",
              category: "navigation",
            },
            {
              key: formatKeyForDisplay(keybindings.navigation.pageUp),
              description: "Page up",
              category: "navigation",
            },
            {
              key: formatKeyForDisplay(keybindings.navigation.pageDown),
              description: "Page down",
              category: "navigation",
            },
            {
              key: formatKeyForDisplay(keybindings.navigation.top),
              description: "Go to first item",
              category: "navigation",
            },
            {
              key: formatKeyForDisplay(keybindings.navigation.bottom),
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
              key: formatKeyForDisplay(keybindings.search.exit),
              description: "Exit search mode",
              category: "search",
            },
            {
              key: "Tab",
              description: "Change search scope",
              category: "search",
            },
            {
              key: formatKeyForDisplay(keybindings.search.next),
              description: "Go to next result",
              category: "navigation",
            },
            {
              key: formatKeyForDisplay(keybindings.search.previous),
              description: "Go to previous result",
              category: "navigation",
            },
            {
              key: formatKeyForDisplay(keybindings.modes.search),
              description: "Start new search",
              category: "search",
            },
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
export function getQuickHelpText(
  mode: AppMode,
  keybindings: KeyBindings,
): string {
  const up = getPrimaryKey(keybindings.navigation.up);
  const down = getPrimaryKey(keybindings.navigation.down);
  const pageUp = getPrimaryKey(keybindings.navigation.pageUp);
  const pageDown = getPrimaryKey(keybindings.navigation.pageDown);
  const top = getPrimaryKey(keybindings.navigation.top);
  const bottom = getPrimaryKey(keybindings.navigation.bottom);
  const search = getPrimaryKey(keybindings.modes.search);
  const searchNext = getPrimaryKey(keybindings.search.next);
  const searchPrev = getPrimaryKey(keybindings.search.previous);
  const export_ = getPrimaryKey(keybindings.modes.export);
  const help = getPrimaryKey(keybindings.modes.help);

  const quickHelp: Record<AppMode, string> = {
    tree: `${up}/${down}: move, Space: toggle, e/c: expand/collapse all, ${help}: help`,
    search: `Enter: search, ${searchNext}/${searchPrev}: next/prev, Tab: scope, ${search}: new search, ${help}: help`,
    filter: `Enter: apply, Tab: switch, i: input, o: toggle view, ${help}: help`,
    collapsible: `${up}/${down}: move, Space: toggle, o/c: expand/collapse, O: all, ${help}: help`,
    schema: `${up}/${down}: scroll, ${pageUp}/${pageDown}: page, ${export_}: export, ${help}: help`,
    raw: `${up}/${down}: scroll, ${pageUp}/${pageDown}: page, ${top}/${bottom}: top/bottom, ${help}: help`,
  };

  return quickHelp[mode] || `${help}: help`;
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
