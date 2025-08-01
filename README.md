# jsont

A Terminal User Interface (TUI) JSON viewer with advanced query capabilities.

## Features

- **Interactive JSON Viewing**: Navigate JSON data with keyboard shortcuts
- **Multiple View Modes**: Tree view, collapsible view, schema view, and raw view
- **Advanced Search**: Search keys, values, or both with highlighting
- **Query Support**: Transform data using jq and JSONata expressions
- **Schema Generation**: Infer and export JSON Schema from data
- **Multi-Format Export**: Export data in JSON, YAML, CSV, XML, and SQL formats
- **Interactive Settings**: Live configuration editor with real-time preview
- **Keyboard Navigation**: vim-like navigation (j/k, gg/G) and page scrolling
- **Debug Mode**: Advanced debugging and performance monitoring
- **Context-Sensitive Help**: Built-in help system for all modes
- **Configuration**: Customizable via YAML configuration files with hot reloading

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
- `T`: Toggle tree view mode
- `C`: Toggle collapsible view mode
- `L`: Toggle line numbers
- `S`: Schema view
- `J`: jq/JSONata query mode
- `D`: Debug mode
- `?`: Help system
- `,`: Interactive settings
- `E`: Export schema
- `Shift+E`: Export data (JSON/YAML/CSV/XML/SQL)
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

### Processing with jq/JSONata
1. Open JSON in jsont
2. Press `J` to enter jq/JSONata mode
3. Enter jq expression: `.user.name` or JSONata expression
4. View transformed result
5. Press `Esc` to return to normal view

### Exporting Schema
1. View JSON data
2. Press `S` for schema view
3. Press `E` to export schema to file

### Exporting Data
1. View JSON data (original or jq-transformed)
2. Press `Shift+E` to open export dialog
3. Choose format: JSON, YAML, CSV, XML, or SQL
4. Specify filename and output directory
5. Press `Enter` to export

### Interactive Settings
1. Press `,` to open the settings interface
2. Navigate with `j/k` and `Tab` to switch categories
3. Press `Enter` or `e` to edit values
4. Press `Ctrl+S` to save changes
5. Press `Esc` to close settings

## Requirements

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher

## License

MIT