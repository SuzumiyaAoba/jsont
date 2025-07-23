# Changelog

## [1.0.0] - 2025-01-XX

### Added
- Interactive Terminal JSON viewer with tree display
- Multiple view modes (Tree, Collapsible, Schema, Raw)
- Advanced search functionality with scope filtering
- jq query transformation support
- JSON Schema inference and export
- YAML-based configuration system
- Keyboard navigation (vim-like shortcuts)
- Performance optimizations with LRU caching
- Comprehensive test suite with performance benchmarks
- Debug logging and viewer

### Features
- **Tree View**: Hierarchical JSON display with expand/collapse
- **Search**: Find keys, values, or both with highlighting
- **Schema Generation**: Auto-infer JSON Schema with export options
- **Configuration**: Customizable display and keybindings via YAML
- **Navigation**: vim-style navigation (j/k, gg/G, Ctrl+f/b)
- **Performance**: LRU caching for optimal memory usage

### Technical
- Built with React 19 + Ink 6.0
- TypeScript with strict configuration
- Vitest testing framework
- Biome for linting/formatting
- Clean architecture with feature-based organization