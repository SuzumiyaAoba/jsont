# jsont

A Terminal User Interface (TUI) JSON viewer with advanced query capabilities.

## Features

- **Interactive JSON Viewing**: Navigate JSON data with keyboard shortcuts
- **Multiple View Modes**: Tree view, collapsible view, schema view, and raw view
- **Advanced Search**: Search keys, values, or both with highlighting
- **Query Support**: Transform data using jq expressions
- **Schema Generation**: Infer and export JSON Schema from data
- **Keyboard Navigation**: vim-like navigation (j/k, gg/G) and page scrolling
- **Configuration**: Customizable via YAML configuration files

## Installation

```bash
npm install -g jsont
```

## Usage

### Basic Usage

```bash
# Read from file
jsont data.json

# Read from stdin
echo '{"name": "John", "age": 30}' | jsont
cat data.json | jsont

# Read from URL
curl -s https://api.example.com/data | jsont
```

### View Modes

- **Tree View** (default): Hierarchical display with expand/collapse
- **Collapsible View** (`C`): Compact view with syntax highlighting  
- **Schema View** (`S`): Auto-generated JSON Schema
- **Raw View** (`R`): Plain JSON with line numbers

### Keyboard Shortcuts

#### Navigation
- `j/k` or `↑/↓`: Move up/down
- `h/l` or `←/→`: Expand/collapse (tree mode)
- `gg`: Go to top
- `G`: Go to bottom
- `Ctrl+f/b`: Page up/down

#### Features
- `/`: Search mode
- `n/N`: Next/previous search result
- `T`: Toggle view mode
- `L`: Toggle line numbers
- `S`: Schema view
- `E`: Export schema
- `q`: Quit

#### Search
- **Search scope**: `Tab` to cycle between All/Keys/Values
- **Clear search**: `Esc` or clear search term

## Configuration

Create `~/.config/jsont/config.yaml`:

```yaml
display:
  interface:
    showLineNumbers: false
    useUnicodeTree: true
  json:
    indent: 2
    useTabs: false
  tree:
    showArrayIndices: true
    showPrimitiveValues: true
    maxValueLength: 100

keybindings:
  navigation:
    up: "k"
    down: "j"
    pageUp: "ctrl+b"
    pageDown: "ctrl+f"
```

## Examples

### Viewing API Response
```bash
curl -s https://jsonplaceholder.typicode.com/posts/1 | jsont
```

### Processing with jq
1. Open JSON in jsont
2. Press `Enter` to enter jq mode
3. Enter jq expression: `.user.name`
4. View transformed result

### Exporting Schema
1. View JSON data
2. Press `S` for schema view
3. Press `E` to export schema to file

## Requirements

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher

## License

MIT