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
        { key: "t", description: "Switch to Tree View mode", category: "mode" },
        { key: "s", description: "Switch to Search mode", category: "mode" },
        { key: "f", description: "Switch to Filter mode", category: "mode" },
        { key: "r", description: "Switch to Raw mode", category: "mode" },
      ],
    },
    {
      title: "Global Controls",
      shortcuts: [
        { key: "?", description: "Toggle this help", category: "global" },
        {
          key: "Esc",
          description: "Exit current mode/close dialogs",
          category: "global",
        },
        { key: "Ctrl+C", description: "Exit application", category: "global" },
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
              key: "Page Up/Down",
              description: "Navigate by page",
              category: "navigation",
            },
            {
              key: "Ctrl+b/f",
              description: "Page up/down (alternative)",
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
              description: "Start/confirm search",
              category: "search",
            },
            {
              key: "Esc",
              description: "Cancel search input",
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
            { key: "s", description: "Start new search", category: "search" },
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
          title: "Filter Operations",
          shortcuts: [
            { key: "Enter", description: "Apply filter", category: "filter" },
            { key: "Esc", description: "Clear filter", category: "filter" },
            {
              key: "Tab",
              description: "Switch filter type",
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
              key: "←/→",
              description: "Move cursor left/right",
              category: "editing",
            },
          ],
        },
      ];

    case "raw":
      return [
        {
          title: "Raw View Navigation",
          shortcuts: [
            {
              key: "j / ↓",
              description: "Scroll down",
              category: "navigation",
            },
            { key: "k / ↑", description: "Scroll up", category: "navigation" },
            {
              key: "Page Up/Down",
              description: "Navigate by page",
              category: "navigation",
            },
            { key: "g", description: "Go to top", category: "navigation" },
            { key: "G", description: "Go to bottom", category: "navigation" },
          ],
        },
        {
          title: "Display Options",
          shortcuts: [
            { key: "w", description: "Toggle word wrap", category: "display" },
            {
              key: "n",
              description: "Toggle line numbers",
              category: "display",
            },
            {
              key: "i",
              description: "Toggle syntax highlighting",
              category: "display",
            },
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
    search: "Enter: search, n/N: next/prev, Tab: scope, ?: help",
    filter: "Enter: apply, Esc: clear, Tab: type, ?: help",
    raw: "j/k: scroll, w: wrap, n: numbers, ?: help",
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
      key: "t",
      mode: "tree",
      description: "Tree View - Hierarchical JSON structure",
    },
    { key: "s", mode: "search", description: "Search - Find content in JSON" },
    { key: "f", mode: "filter", description: "Filter - Apply filters to data" },
    { key: "r", mode: "raw", description: "Raw - Plain text JSON view" },
  ];
}
