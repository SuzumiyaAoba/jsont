# Configuration Guide

jsont supports YAML-based configuration to customize the viewer behavior and keybindings.

## Configuration File Location

The configuration file should be placed at:
- `~/.config/jsont/config.yaml` (Linux/macOS)
- `%APPDATA%/jsont/config.yaml` (Windows)

## Configuration Schema

### Display Settings

```yaml
display:
  interface:
    showLineNumbers: false      # Show line numbers by default
    useUnicodeTree: true        # Use Unicode tree characters (├─, └─)
  
  json:
    indent: 2                   # JSON indentation spaces
    useTabs: false             # Use tabs instead of spaces
  
  tree:
    showArrayIndices: true      # Show array indices [0], [1], etc.
    showPrimitiveValues: true   # Show primitive values inline
    showSchemaTypes: false      # Show inferred types in tree
    maxValueLength: 100         # Truncate values longer than this
```

### Keybindings

```yaml
keybindings:
  navigation:
    up: "k"                    # Move up
    down: "j"                  # Move down
    left: "h"                  # Collapse/left
    right: "l"                 # Expand/right
    pageUp: "ctrl+b"           # Page up
    pageDown: "ctrl+f"         # Page down
    home: "gg"                 # Go to top
    end: "G"                   # Go to bottom
  
  features:
    search: "/"                # Enter search mode
    toggleView: "T"            # Toggle view mode
    toggleLineNumbers: "L"     # Toggle line numbers
    schemaView: "S"            # Switch to schema view
    export: "E"                # Export schema
    help: "?"                  # Show help
    quit: "q"                  # Quit application
```

## Example Configuration

```yaml
# ~/.config/jsont/config.yaml
display:
  interface:
    showLineNumbers: true
    useUnicodeTree: true
  
  json:
    indent: 4
    useTabs: false
  
  tree:
    showArrayIndices: true
    showPrimitiveValues: true
    maxValueLength: 80

keybindings:
  navigation:
    up: "k"
    down: "j"
    pageUp: "ctrl+u"
    pageDown: "ctrl+d"
```

## Validation

jsont validates the configuration file on startup and will:
- Show warnings for invalid values
- Use default values for missing or invalid settings
- Continue running with valid settings

## Troubleshooting

### Configuration Not Loading
1. Check file location: `~/.config/jsont/config.yaml`
2. Verify YAML syntax with a YAML validator
3. Check file permissions (readable by user)

### Invalid Configuration Values
- Boolean values: `true` or `false` (not `yes`/`no`)
- Numbers: Use integers for indentation and lengths
- Strings: Quote special characters in keybindings

### Default Values
If configuration is missing or invalid, jsont uses these defaults:
- Line numbers: disabled
- Unicode tree: enabled
- Indent: 2 spaces
- Array indices: shown
- Max value length: 100 characters