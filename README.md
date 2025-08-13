# jsont

A high-performance Terminal User Interface (TUI) JSON viewer - Interactive data exploration and query capabilities

[![Node.js CI](https://github.com/SuzumiyaAoba/jsont/actions/workflows/ci.yml/badge.svg)](https://github.com/SuzumiyaAoba/jsont/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/jsont.svg)](https://badge.fury.io/js/jsont)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern Terminal User Interface (TUI) JSON viewer built with React and Ink, offering advanced query capabilities, interactive exploration, and comprehensive data export options.

## ✨ Key Features

### 🔍 Advanced Display Modes
- **Tree View**: Intuitive hierarchical structure display and manipulation
- **Collapsible View**: Compact display with syntax highlighting
- **Schema View**: Automatic JSON schema generation and display
- **Raw View**: Plain JSON with line numbers

### 🚀 Powerful Search & Query Features
- **Scoped Search**: Choose from keys, values, or entire content
- **Regex Support**: Flexible pattern matching
- **jq Query Engine**: Powerful data transformation and extraction
- **Real-time Preview**: Instant results during input

### 📊 Data Export
- **Multiple Formats**: Output in JSON, YAML, CSV, XML, SQL formats
- **JSON Schema**: Automatic schema generation from data structure
- **SQL Table Conversion**: Generate SQL DDL from structured data

### ⚡ Performance Optimization
- **Large File Support**: Fast processing of JSON files up to hundreds of MB
- **Virtual Scrolling**: Memory-efficient display
- **Cache System**: Fast reuse of processed data
- **Background Processing**: Non-blocking data processing

### 🎨 Customization
- **Interactive Settings**: Settings editor with live preview
- **YAML Configuration**: Hot-reload supported configuration files
- **Key Bindings**: vim-style keyboard navigation
- **Themes**: Dark and light mode support

### 🛠️ Developer Features
- **Debug Mode**: Performance monitoring and troubleshooting
- **Help System**: Context-aware help
- **Settings Export**: Share settings across teams
- **Detailed Logging**: Comprehensive operational logs for development and operations

## 📦 Installation

### Via npm (Recommended)
```bash
npm install -g jsont
```

### Add to Local Project
```bash
npm install jsont
npx jsont data.json
```

### Build Development Version
```bash
git clone https://github.com/SuzumiyaAoba/jsont.git
cd jsont
npm install
npm run build
npm link
```

### System Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Terminal**: ANSI color supported terminal

## 🚀 Usage

### Basic Usage

```bash
# Read from file
jsont data.json
jsont /path/to/large-dataset.json

# Read from stdin
echo '{"name": "John", "age": 30, "skills": ["JavaScript", "TypeScript"]}' | jsont
cat complex-data.json | jsont

# Display API responses directly
curl -s https://api.github.com/users/octocat | jsont
curl -s https://jsonplaceholder.typicode.com/posts/1 | jsont

# Use in pipeline processing
jq '.users[]' large-data.json | jsont
aws ec2 describe-instances --output json | jsont
```

### Advanced Usage Examples

```bash
# Combine with jq queries
echo '{"users": [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]}' | jsont
# Press J key in app to enter query mode: .users[] | select(.age > 25)

# Analyze large log files
tail -f application.log | jq -c '. | select(.level == "ERROR")' | jsont

# Investigate Kubernetes resources
kubectl get pods -o json | jsont
```

### 🎛️ Display Modes

| Mode | Key | Description | Use Case |
|------|-----|-------------|----------|
| **Tree View** | `T` (default) | Hierarchical structure with expand/collapse | Understanding structure, exploring large data |
| **Collapsible View** | `C` | Compact display with syntax highlighting | Code review, detailed view of small data |
| **Schema View** | `S` | Auto-generated JSON schema | API spec confirmation, data structure documentation |
| **Raw View** | `R` | Plain JSON with line numbers | Copy-paste, syntax verification |

### ⌨️ Keyboard Shortcuts

#### 🧭 Navigation
| Key | Function | Description |
|-----|----------|-------------|
| `j` / `k` | Up/Down movement | vim-style navigation |
| `↑` / `↓` | Up/Down movement | Arrow key movement |
| `h` / `l` | Expand/Collapse | Tree mode hierarchy operations |
| `←` / `→` | Expand/Collapse | Arrow key hierarchy operations |
| `gg` | Go to top | Move to top of data |
| `G` | Go to bottom | Move to bottom of data |
| `Ctrl+f` / `Ctrl+b` | Page movement | Half-page scrolling |

#### 🔍 Search & Filter
| Key | Function | Description |
|-----|----------|-------------|
| `/` | Search mode | Start incremental search |
| `Tab` | Cycle scope | All → Keys → Values → All |
| `R` | Regex mode | Toggle regex search |
| `n` / `N` | Navigate results | Move to next/previous result |
| `Esc` | Exit search | End search mode |

#### 🎨 Display Toggle
| Key | Function | Description |
|-----|----------|-------------|
| `T` | Tree view | Toggle hierarchical structure display |
| `C` | Collapsible view | Toggle compact display |
| `S` | Schema view | JSON schema display |
| `L` | Line numbers | Toggle line number display |
| `D` | Debug mode | Display debug information |

#### ⚡ Actions
| Key | Function | Description |
|-----|----------|-------------|
| `J` | jq Query mode | Execute jq/JSONata queries |
| `E` | Schema export | Export JSON schema to file |
| `Shift+E` | Data export | Export data in multiple formats |
| `,` | Settings | Interactive settings editor |
| `?` | Help | Context-aware help |
| `q` | Quit | Exit application |

#### 🔄 Search Feature Details
- **Scope Search**: Cycle through search ranges with `Tab` key
  - `All`: Search entire content
  - `Keys`: Search only key names
  - `Values`: Search only values
- **Regular Expression**: Toggle regex mode with `R` key
- **Real-time**: Display matching results as you type

## ⚙️ Settings & Customization

### Interactive Settings

Press `,` key in the application to open the interactive settings screen:

- **Real-time Preview**: Immediate confirmation of setting changes
- **Input Validation**: Pre-validation of invalid values
- **Category Classification**: Organized settings by functionality
- **Help Display**: Detailed description for each setting

### Configuration File

Create `~/.config/jsont/config.yaml` for customization:

```yaml
# Display settings
display:
  interface:
    showLineNumbers: true          # Display line numbers
    useUnicodeTree: true          # Unicode characters for tree diagrams
  json:
    indent: 2                     # Indentation width
    useTabs: false               # Use tab characters
  tree:
    showArrayIndices: true        # Display array indices
    showPrimitiveValues: true     # Display primitive values
    maxValueLength: 100          # Maximum display length for values

# Key binding settings
keybindings:
  navigation:
    up: "k"                      # Up movement
    down: "j"                    # Down movement
    pageUp: "ctrl+b"            # Page up
    pageDown: "ctrl+f"          # Page down
    goToTop: "gg"               # Move to top
    goToBottom: "G"             # Move to bottom
  search:
    start: "/"                  # Start search
    next: "n"                   # Next result
    previous: "N"               # Previous result
    toggleRegex: "R"            # Toggle regex
    cycleScope: "tab"           # Cycle scope
  actions:
    help: "?"                   # Display help
    quit: "q"                   # Quit
    settings: ","               # Settings screen
    export: "E"                 # Export
    jqMode: "J"                 # jq mode

# Performance settings
performance:
  cacheSize: 200               # LRU cache size
  maxFileSize: 104857600       # Maximum file size (100MB)
  virtualScrolling: true        # Enable virtual scrolling
  backgroundProcessing: true    # Background processing
```

### Detailed Setting Descriptions

#### Display Settings (`display`)
- **showLineNumbers**: Display line numbers for file content
- **useUnicodeTree**: Use Unicode characters (├─└) for tree diagrams
- **indent**: Number of indentation characters for JSON formatting
- **maxValueLength**: Character count for truncating long values

#### Performance Settings (`performance`)
- **cacheSize**: Number of cached processing results
- **maxFileSize**: Maximum processable file size
- **virtualScrolling**: Efficient display of large data

### Immediate Application of Settings

Configuration file changes are automatically detected and applied without restarting the application.

## 💡 Practical Examples & Use Cases

### 🌐 API Development & Debugging

```bash
# Check REST API responses
curl -s https://jsonplaceholder.typicode.com/posts/1 | jsont
# → Verify structured responses in tree view

# GraphQL API query results
curl -X POST -H "Content-Type: application/json" \
  -d '{"query": "{ users { id name email } }"}' \
  https://api.example.com/graphql | jsont

# Detailed analysis of error responses
curl -s https://api.example.com/failing-endpoint | jsont
# → Check error structure in schema view, create documentation
```

### 🔍 Log Analysis & Monitoring

```bash
# Structured log analysis
tail -f /var/log/app/structured.log | jq -c 'select(.level=="ERROR")' | jsont
# → Real-time error log monitoring

# Filtering by specific conditions
cat audit.log | jq -c 'select(.timestamp > "2024-01-01")' | jsont
# → Time-series data analysis

# Elasticsearch/OpenSearch results
curl -s 'localhost:9200/logs/_search' | jsont
# → Structure analysis of search results
```

### ☁️ Cloud & Infrastructure Management

```bash
# AWS CLI output analysis
aws ec2 describe-instances --output json | jsont
# → Organize and verify instance information in tree structure

aws s3api list-objects --bucket my-bucket --output json | jsont
# → Structured display of S3 object list

# Kubernetes resource investigation
kubectl get pods -o json | jsont
# → Hierarchical display of Pod details

kubectl describe service my-service -o json | jsont
# → Structure verification of service configuration

# Terraform state file analysis
terraform show -json | jsont
# → Infrastructure state visualization
```

### 📊 Data Processing & Transformation Workflow

#### 1. jq/JSONata Query Processing
```bash
# 1. Open data with jsont
cat users.json | jsont

# 2. Press J key in app for query mode
# 3. Enter jq query: .users[] | select(.age > 25) | {name, email}
# 4. Real-time preview of results
# 5. Press Enter to confirm results, display in new view
```

#### 2. Schema Generation & Documentation
```bash
# 1. Check API specification
curl -s https://api.example.com/users/1 | jsont

# 2. Switch to schema view with S key
# 3. Verify auto-generated JSON schema
# 4. Export schema to file with E key
# → Save as api-user-schema.json
```

#### 3. Data Export & Sharing
```bash
# 1. Process and filter data
cat large-dataset.json | jsont

# 2. Identify and extract required data sections
# 3. Shift+E for export dialog
# 4. Select output format:
#   - JSON: For program processing
#   - CSV: For Excel analysis
#   - YAML: For configuration files
#   - XML: For legacy system integration
#   - SQL: For database insertion
```

### ⚙️ Configuration Management & Team Collaboration

#### Interactive Settings Usage
```bash
# 1. Start jsont and press comma key
echo '{}' | jsont
# ↓ Press , key

# 2. Adjust in settings screen:
#   - Display settings: Line numbers, indentation, tree diagram style
#   - Key bindings: Customize operation keys
#   - Performance: File size limits, cache size

# 3. Save settings with Ctrl+S
# 4. Share settings within team
cp ~/.config/jsont/config.yaml ./team-jsont-config.yaml
```

### 🎯 Real Workflow Examples

#### API Developer's Day
```bash
# Morning: API health check
curl -s https://api.company.com/health | jsont

# Morning: Response verification for new feature development
curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.company.com/v2/users | jsont
# → Schema verification with S key → Document generation with E key

# Afternoon: Performance test result analysis
cat load-test-results.json | jsont
# → jq query with J key → .results[] | select(.responseTime > 1000)
# → Identify slow API endpoints

# Evening: Error log investigation
tail -100 /var/log/api/errors.log | jq -c . | jsont
# → Error pattern analysis and report creation
```

#### DevOps Engineer's Monitoring Tasks
```bash
# System status verification
kubectl get pods -A -o json | jsont
# → Hierarchical display of Pod status across entire cluster

# Configuration file validation
cat kubernetes/production/deployment.yaml | yq eval -o=json | jsont
# → Convert YAML configuration to JSON and verify structure

# Metrics analysis
curl -s 'http://prometheus:9090/api/v1/query?query=up' | jsont
# → Structured display of Prometheus metrics
```

## 🏗️ Technical Specifications & Architecture

### System Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Memory**: 512MB or more recommended (for large file processing)
- **Terminal**: ANSI color support, UTF-8 character support

### Performance Characteristics

| Item | Specification | Notes |
|------|---------------|-------|
| **Maximum File Size** | 100MB | Configurable |
| **Processing Speed** | <100ms | Initial load of 1MB file |
| **Memory Usage** | <200MB | Processing 10MB file |
| **Search Responsiveness** | <16ms | Real-time search response |
| **Cache Efficiency** | 95%+ | Hit rate for re-display |

### Supported Data Formats

- **JSON**: Standard JSON format
- **JSON5**: Extended JSON with comments and trailing commas
- **JSONL/NDJSON**: Newline-delimited JSON (streaming support)
- **Minified JSON**: Compressed single-line JSON

### Export Format Support

| Format | Extension | Use Case |
|--------|-----------|----------|
| **JSON** | `.json` | API, configuration files |
| **YAML** | `.yaml`, `.yml` | Kubernetes, CI/CD configuration |
| **CSV** | `.csv` | Excel analysis, data visualization |
| **XML** | `.xml` | Legacy system integration |
| **SQL** | `.sql` | Database table definitions |
| **JSON Schema** | `.schema.json` | API specification, validation |

### Architecture Overview

```
┌─────────────────────────────────────────────┐
│                 UI Layer                    │
├─────────────────────────────────────────────┤
│ Features: Tree│Search│Export│Settings│Help  │
├─────────────────────────────────────────────┤
│          Core Processing Engine             │
├─────────────────────────────────────────────┤
│    State Management (Jotai)               │
├─────────────────────────────────────────────┤
│  Terminal I/O │ File System │ Clipboard     │
└─────────────────────────────────────────────┘
```

## 🤝 Contributing

### Development Environment Setup
```bash
git clone https://github.com/SuzumiyaAoba/jsont.git
cd jsont
npm install
npm run dev  # Start in development mode
```

### Running Tests
```bash
npm run test          # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:ui       # Run with test UI
npm run test:ci       # Run tests for CI environment
```

### Code Quality Management
```bash
npm run check         # Biome lint + format check
npm run check:write   # Apply automatic fixes
npm run type-check    # TypeScript type checking
```

### Pull Requests

1. Fork and create a feature branch
2. Implement changes (including tests)
3. Verify code quality with `npm run check`
4. Create a pull request

### Issue Reporting

- **Bug Report**: Include reproduction steps, expected behavior, actual behavior
- **Feature Request**: Provide specific use cases and expected benefits
- **Performance Issue**: Include file size, processing time, and system specifications

## 📊 Roadmap

### 🎯 Coming Soon
- [ ] **Plugin System**: Custom filters and exporters
- [ ] **Theme System**: Custom color scheme support
- [ ] **API Mode**: Use as RESTful API
- [ ] **Web Interface**: Browser-based GUI

### 🔮 Future Vision
- [ ] **Real-time Collaboration**: Multi-user data exploration
- [ ] **AI Assistant**: Natural language query generation
- [ ] **Database Integration**: Direct DB connection and query execution
- [ ] **Visualization Features**: Graph and chart generation

## 📄 License

**MIT License** - See [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

This project is powered by the following open source projects:

- [React](https://react.dev/) + [Ink](https://github.com/vadimdemedes/ink) - TUI framework
- [Jotai](https://jotai.org/) - Atomic state management
- [node-jq](https://github.com/sanack/node-jq) - jq query engine
- [es-toolkit](https://github.com/toss/es-toolkit) - High-performance utilities
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development environment

---

<div align="center">

**⭐ If this project was helpful, please star it on GitHub!**

[![GitHub Repo stars](https://img.shields.io/github/stars/SuzumiyaAoba/jsont?style=social)](https://github.com/SuzumiyaAoba/jsont/stargazers)

</div>