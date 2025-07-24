/**
 * Configuration mapping utilities
 */

import { useConfig } from '@core/context/ConfigContext';
import type { JsontConfig } from '@core/config/types';

/**
 * Extract current configuration values from the context
 */
export function useCurrentConfigValues(): Record<string, unknown> {
  const config = useConfig();
  
  return {
    // Display settings
    'display.interface.showLineNumbers': config.display.interface.showLineNumbers,
    'display.interface.debugMode': config.display.interface.debugMode,
    'display.interface.showStatusBar': config.display.interface.showStatusBar,
    'display.interface.defaultHeight': config.display.interface.defaultHeight,
    'display.json.indent': config.display.json.indent,
    'display.json.useTabs': config.display.json.useTabs,
    'display.json.maxLineLength': config.display.json.maxLineLength,
    'display.tree.showArrayIndices': config.display.tree.showArrayIndices,
    'display.tree.showPrimitiveValues': config.display.tree.showPrimitiveValues,
    'display.tree.maxValueLength': config.display.tree.maxValueLength,
    'display.tree.useUnicodeTree': config.display.tree.useUnicodeTree,
    'display.tree.showSchemaTypes': config.display.tree.showSchemaTypes,
    
    // Keybinding settings
    'keybindings.navigation.up': config.keybindings.navigation.up,
    'keybindings.navigation.down': config.keybindings.navigation.down,
    'keybindings.navigation.pageUp': config.keybindings.navigation.pageUp,
    'keybindings.navigation.pageDown': config.keybindings.navigation.pageDown,
    'keybindings.navigation.top': config.keybindings.navigation.top,
    'keybindings.navigation.bottom': config.keybindings.navigation.bottom,
    'keybindings.modes.search': config.keybindings.modes.search,
    'keybindings.modes.schema': config.keybindings.modes.schema,
    'keybindings.modes.tree': config.keybindings.modes.tree,
    'keybindings.modes.collapsible': config.keybindings.modes.collapsible,
    'keybindings.modes.jq': config.keybindings.modes.jq,
    'keybindings.modes.lineNumbers': config.keybindings.modes.lineNumbers,
    'keybindings.modes.help': config.keybindings.modes.help,
    'keybindings.modes.quit': config.keybindings.modes.quit,
    
    // Behavior settings
    'behavior.search.caseSensitive': config.behavior.search.caseSensitive,
    'behavior.search.regex': config.behavior.search.regex,
    'behavior.search.highlight': config.behavior.search.highlight,
    'behavior.navigation.halfPageScroll': config.behavior.navigation.halfPageScroll,
    'behavior.navigation.autoScroll': config.behavior.navigation.autoScroll,
    'behavior.navigation.scrollOffset': config.behavior.navigation.scrollOffset,
  };
}

/**
 * Convert flat settings object back to nested config structure
 */
export function flatToNestedConfig(flat: Record<string, unknown>): Partial<JsontConfig> {
  const config: any = {};
  
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current = config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!part) continue;
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      current[lastPart] = value;
    }
  }
  
  return config;
}