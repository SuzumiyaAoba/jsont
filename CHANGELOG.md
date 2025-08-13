# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🔄 Planned
- Plugin system for custom filters and exporters
- Custom theme system support
- RESTful API mode
- Web browser interface
- Real-time collaboration features

## [1.0.0] - 2024-01-XX

### ✨ Added
- **Interactive JSON Exploration**: Terminal-based JSON viewer with keyboard navigation
- **Multiple View Modes**: Tree view, collapsible view, schema view, and raw view
- **Advanced Search Capabilities**:
  - Scope-based search (All/Keys/Values)
  - Regular expression support
  - Real-time search with highlighting
  - Search result navigation (n/N keys)
- **Powerful Query Engine**:
  - jq query integration with syntax validation
  - Query result preview and execution
  - Query history and favorites
- **JSON Schema Generation**: Automatic schema inference and export
- **Multi-Format Export**:
  - JSON (formatted/minified)
  - YAML configuration files
  - CSV for data analysis
  - XML for legacy systems
  - SQL DDL for database integration
- **Interactive Configuration**:
  - Live settings editor with preview
  - YAML configuration files with hot reloading
  - Customizable keybindings
  - Theme and display preferences
- **Performance Optimization**:
  - LRU caching system for processed data
  - Virtualized scrolling for large datasets
  - Background processing for non-blocking operations
  - Memory-efficient handling of 100MB+ files
- **Developer Tools**:
  - Debug mode with performance monitoring
  - Context-sensitive help system
  - Comprehensive logging and diagnostics
  - Development configuration options

### 🏗️ Technical Improvements
- **Architecture**: Clean architecture with feature-driven design
- **State Management**: Jotai-based atomic state management
- **Type Safety**: TypeScript with strictest configuration
- **Testing**: 800+ tests with comprehensive coverage
- **Build System**: tsup with path alias support and extensionless imports
- **Code Quality**: Biome integration for linting and formatting
- **CI/CD**: Automated testing with memory optimization for large codebases

### 🎨 User Experience
- **Keyboard Navigation**: vim-like navigation patterns (j/k, gg/G)
- **Intuitive Interface**: Self-discovering interface with contextual help
- **Accessibility**: Screen reader support and high contrast themes
- **Performance**: Sub-100ms response times for most operations
- **Error Handling**: Graceful error recovery with helpful suggestions

### 🔧 Configuration
- **Default Paths**: `~/.config/jsont/config.yaml`
- **Hot Reloading**: Configuration changes applied immediately
- **Validation**: Real-time validation with error messages
- **Import/Export**: Share configurations across team members

### 📊 Data Handling
- **Large Files**: Efficient handling of files up to 100MB
- **Streaming**: Progressive loading for very large datasets  
- **Format Support**: JSON, JSON5, JSONL/NDJSON
- **Error Recovery**: Intelligent parsing with error suggestions
- **Memory Management**: Controlled memory usage with configurable limits

### ⚡ Performance Benchmarks
- **Startup Time**: <500ms for medium-sized files (1-10MB)
- **Search Response**: <16ms for real-time search operations
- **Memory Usage**: <200MB for 10MB JSON files
- **Export Speed**: <2s for most export operations
- **Cache Hit Rate**: 95%+ for repeated operations

### 🌐 Internationalization
- **Language Support**: Japanese and English documentation
- **Unicode**: Full Unicode support for international data
- **Localization**: Localized help text and error messages

---

## Development History

### Phase 1: Foundation (Weeks 1-2)
- [x] Basic JSON parsing and display
- [x] Simple keyboard navigation
- [x] Core application structure
- [x] Basic testing framework

### Phase 2: Core Features (Weeks 3-6)
- [x] Advanced search functionality with scopes
- [x] Regular expression search support
- [x] Tree view with expand/collapse
- [x] Multiple view modes implementation
- [x] Configuration system with YAML support

### Phase 3: Advanced Features (Weeks 7-10)
- [x] jq query engine integration
- [x] JSON schema generation
- [x] Multi-format export capabilities
- [x] Interactive settings interface
- [x] Performance optimization and caching

### Phase 4: Polish & Optimization (Weeks 11-12)
- [x] UI/UX improvements
- [x] Comprehensive testing suite
- [x] Documentation and help system
- [x] Memory optimization for CI/CD
- [x] Production deployment preparation

---

## Migration Guide

### From Version 0.x to 1.0.0
This is the initial stable release. No migration needed for new users.

### Configuration Changes
- Configuration location: `~/.config/jsont/config.yaml`
- Default keybindings may differ from development versions
- Some performance settings have been optimized

---

## Contributors

Special thanks to all contributors who made this release possible:

- **Core Development**: Architecture design, feature implementation, testing
- **Documentation**: User guides, technical documentation, examples
- **Testing**: Test cases, performance benchmarks, quality assurance
- **UI/UX**: Interface design, accessibility improvements
- **Performance**: Optimization, memory management, large file handling

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

This project builds upon excellent open-source libraries:
- [React](https://react.dev/) + [Ink](https://github.com/vadimdemedes/ink) - TUI framework
- [Jotai](https://jotai.org/) - Atomic state management  
- [node-jq](https://github.com/sanack/node-jq) - jq query engine
- [es-toolkit](https://github.com/toss/es-toolkit) - High-performance utilities
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development

Thank you to the open-source community for making this project possible!