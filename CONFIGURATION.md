# jsont Configuration System

This document describes the configuration system implemented for jsont.

## Overview

The jsont application now supports configuration through a YAML file located at `~/.config/jsont/config.yaml`. This allows users to customize keybindings, display settings, and behavior options.

## Configuration File Location

```bash
~/.config/jsont/config.yaml
```

## Configuration Structure

### Keybindings

```yaml
keybindings:
  navigation:
    up: ["k", "ArrowUp"]
    down: ["j", "ArrowDown"]
    pageUp: ["Ctrl+b", "PageUp"]
    pageDown: ["Ctrl+f", "PageDown"]
    top: ["g"]
    bottom: ["G"]
  modes:
    search: ["/"]
    schema: ["S"]
    tree: ["T"]
    collapsible: ["C"]
    jq: ["J"]
    lineNumbers: ["L"]
    debug: ["D"]
    help: ["?"]
    export: ["E"]
    exportData: ["Shift+E"]
    settings: [","]
    quit: ["q"]
  search:
    next: ["n"]
    previous: ["N"]
    exit: ["Escape"]
```

### Display Settings

```yaml
display:
  json:
    # Number of spaces for indentation (ignored if useTabs is true)
    indent: 4
    # Use tabs instead of spaces for indentation
    useTabs: false
    # Maximum line length before wrapping
    maxLineLength: 120
  tree:
    # Show array indices in tree view
    showArrayIndices: true
    # Show primitive values in tree view
    showPrimitiveValues: true
    # Maximum length for displaying values
    maxValueLength: 60
    # Use Unicode tree characters
    useUnicodeTree: true
    # Show schema types in tree view
    showSchemaTypes: true
  interface:
    # Show line numbers by default
    showLineNumbers: true
    # Enable debug mode by default
    debugMode: false
    # Default terminal height for calculations
    defaultHeight: 30
    # Status bar configuration
    showStatusBar: true
```

### Behavior Settings

```yaml
behavior:
  search:
    # Case sensitive search by default
    caseSensitive: false
    # Enable regex search by default
    regex: false
    # Highlight search results
    highlight: true
  navigation:
    # Enable half-page scrolling
    halfPageScroll: true
    # Auto-scroll to search results
    autoScroll: true
    # Scroll offset from edges
    scrollOffset: 3
```

## Implementation Details

### Architecture

1. **Configuration Types** (`src/core/config/types.ts`)
   - Comprehensive TypeScript interfaces for all configuration options
   - Support for partial configuration overrides

2. **Default Configuration** (`src/core/config/defaults.ts`)
   - Fallback values for all configuration options
   - Ensures application works even without a config file

3. **Configuration Loader** (`src/core/config/loader.ts`)
   - YAML file parsing using `js-yaml` library
   - Deep merging of user config with defaults
   - Validation and sanitization of configuration values
   - Graceful error handling for invalid configurations

4. **React Context** (`src/core/context/ConfigContext.tsx`)
   - Provides configuration access throughout the application
   - Hooks for accessing specific configuration values
   - Type-safe configuration access

### Key Features

- **Hot Configuration Loading**: Configuration is loaded at application startup with hot-reloading support
- **Interactive Configuration UI**: Built-in settings editor accessible with `,` key
- **Partial Configuration Support**: Users only need to specify values they want to change
- **Validation**: Invalid configuration values are ignored, defaults are used
- **Error Handling**: Malformed YAML files fall back to defaults with warnings
- **Type Safety**: Full TypeScript support for configuration access
- **Live Preview**: Changes are visible immediately in the interactive settings interface

### Integration Points

The configuration system has been integrated into:

1. **JSON Display** (`JsonViewer`): Uses `display.json.indent` and `display.json.useTabs`
2. **Tree View** (`TreeView`): Uses all `display.tree.*` and `display.interface.*` settings
3. **Application Core** (`App.tsx`): Uses configuration for JSON formatting

## Usage Examples

### Custom Indentation

To use tabs instead of spaces for JSON formatting:

```yaml
display:
  json:
    useTabs: true
```

### Different Key Bindings

To use vim-style navigation:

```yaml
keybindings:
  navigation:
    up: ["k"]
    down: ["j"]
    pageUp: ["Ctrl+u"]
    pageDown: ["Ctrl+d"]
```

### Tree View Customization

```yaml
display:
  tree:
    showArrayIndices: false
    maxValueLength: 100
    useUnicodeTree: false
```

## Testing

The configuration system includes comprehensive tests:

- **Unit Tests**: Configuration loading, merging, and validation
- **Integration Tests**: React context and hook functionality
- **Error Handling Tests**: Invalid YAML, missing files, type validation

## Interactive Settings Interface

The application now includes a built-in interactive settings editor:

### Accessing Settings
- Press `,` to open the interactive settings interface
- Navigate using `j/k` keys and `Tab` to switch categories
- Press `Enter` or `e` to edit field values
- Press `Ctrl+S` to save changes to disk
- Press `Ctrl+R` to reset to defaults
- Press `Esc` to close the settings interface

### Features
- **Real-time Preview**: See changes immediately as you edit
- **Input Validation**: Invalid values are rejected with helpful error messages
- **Category Organization**: Settings are grouped logically for easy navigation
- **Live Help**: Each setting shows description and valid values

## Export Capabilities

The application supports exporting data in multiple formats:
- **JSON**: Standard JSON format
- **YAML**: Human-readable YAML format
- **CSV**: Tabular data format for spreadsheets
- **XML**: Hierarchical XML representation
- **SQL**: Database table creation and insert statements

## Future Enhancements

Additional features being considered:

1. **Command-line Overrides**: Temporary configuration via CLI flags
2. **Profile Support**: Multiple named configuration profiles
3. **Theme System**: Customizable color schemes and visual themes

## Migration

The configuration system is backward compatible. Existing installations will continue to work with default settings. Users can gradually adopt configuration by creating the config file and adding only the settings they want to customize.