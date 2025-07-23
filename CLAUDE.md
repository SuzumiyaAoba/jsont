# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`jsont` is a Terminal User Interface (TUI) JSON viewer built with React and Ink. The application reads JSON data from stdin or files and displays it in various interactive formats including tree view, collapsible view, and schema view with advanced query capabilities using jq and JSONata.

## Key Commands

### Development
- `npm run dev` - Run the application in development mode using tsx
- `npm run build` - Bundle the application using tsup (supports extensionless imports)
- `npm run start` - Run the compiled application from `dist/index.js`

### Testing
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once and exit
- `npm run test:ui` - Open Vitest UI for interactive testing
- `npm run test -- tree` - Run specific test files matching "tree"

### Code Quality
- `npm run check` - Run Biome linter and formatter checks
- `npm run check:write` - Run Biome checks and apply safe fixes
- `npm run type-check` - Run TypeScript type checking only
- `npm run lint` - Lint source code only
- `npm run format:write` - Format source code

### Usage
```bash
echo '{"key": "value"}' | npm run dev
cat file.json | npm run dev
npm run dev path/to/file.json
```

## Architecture Overview

### Clean Architecture Pattern

The codebase follows a feature-driven clean architecture with clear separation of concerns:

#### Entry Point (`src/index.tsx`)
- Minimal entry point that delegates to AppService
- Uses proper error handling with `handleFatalError`

#### Core Layer (`src/core/`)
- **Services**: `AppService` orchestrates application lifecycle and initialization
- **Utils**: Terminal management, process lifecycle, stdin handling, error handling, LRU cache
- **Types**: Application-wide type definitions
- **Config**: YAML configuration loading and validation
- **Context**: React context providers for configuration

#### Features Layer (`src/features/`)
Organized by feature domains, each containing:
- **Components**: React/Ink UI components
- **Types**: Feature-specific type definitions  
- **Utils**: Business logic and utilities
- **Tests**: Co-located test files

**Key Features:**
- `tree/` - Interactive tree view with keyboard navigation
- `collapsible/` - Collapsible JSON viewer with syntax highlighting
- `search/` - Search functionality across JSON data
- `jq/` - jq query transformation support
- `schema/` - JSON schema inference and export
- `json-rendering/` - Core JSON parsing and syntax highlighting
- `common/` - Shared components (TextInput, BaseViewer, hooks)
- `debug/` - Debug logging and viewer components
- `navigation/` - Goto navigation (gg/G) and keyboard shortcuts
- `help/` - Context-sensitive help system
- `status/` - Status bar and line number display

### State Management
- React hooks for local component state
- Jotai for atomic global state where needed
- State lifted to App.tsx for cross-feature coordination

### Keyboard Input Architecture
- Unified keyboard handling through Ink's `useInput` in App.tsx
- Delegation pattern: App.tsx routes input to active feature components
- Each feature can register keyboard handlers via callback props
- Advanced stdin handling supports keyboard input even in pipe mode

## Technical Stack

### Core Technologies
- **Runtime**: Node.js 18+ with ES Modules
- **UI Framework**: React 19 + Ink 6.0 for terminal rendering
- **Language**: TypeScript with strictest configuration
- **Build**: tsup for bundling with path alias support
- **Testing**: Vitest with coverage reporting

### Code Quality Tools
- **Linting/Formatting**: Biome (replaces ESLint + Prettier)
- **Git Hooks**: Husky + lint-staged for pre-commit quality checks
- **TypeScript**: Strict mode with path aliases (`@core/*`, `@features/*`)

### Key Dependencies
- `neverthrow` - Result type pattern for error handling
- `node-jq` - jq query processing
- `json5` - Enhanced JSON parsing
- `es-toolkit` - Modern utility functions
- `js-yaml` - YAML configuration parsing
- `zod` - Runtime type validation
- `jotai` - Atomic state management
- `mutative` - Immutable state updates

## Development Guidelines

### Import Standards
- **Always use extensionless imports** for TypeScript files
- **Use path aliases**: `@core/*` and `@features/*` instead of relative paths
- **Organize imports**: external → aliases → relative
- **Example**:
  ```typescript
  import { Box, Text } from "ink";
  import type { JsonValue } from "@core/types/index";
  import { TreeView } from "@features/tree/components/TreeView";
  import { formatData } from "./utils/formatter";
  ```

### File Organization
- Tests co-located with source files using `.test.ts` suffix
- Feature-based organization with clear domain boundaries
- Barrel exports (`index.ts`) for clean module interfaces

### Error Handling
- Use `neverthrow` Result type pattern instead of throwing exceptions
- Safe operations return `Result<T, E>` types
- Comprehensive error context and recovery suggestions

### TypeScript Configuration
- Extends `@tsconfig/strictest` for maximum type safety
- Module resolution: "bundler" for modern import handling
- Path aliases configured in both tsconfig.json and build tools
- `any` types are intentionally used for JSON data handling

## Stdin and Keyboard Handling

The application implements sophisticated stdin processing to enable keyboard navigation in all input modes:

### Pipe Mode Navigation
- **Challenge**: When JSON is piped (`echo '...' | jsont`), stdin is consumed for data, preventing keyboard input
- **Solution**: Read-then-reinitialize strategy that restores keyboard input after JSON processing
- **Implementation**: Completely read stdin, parse JSON, then create new TTY streams for keyboard input

### Navigation Features
- **Line Navigation**: j/k, arrow keys for precise movement
- **Page Navigation**: Ctrl+f/b for half-page scrolling
- **Goto Navigation**: gg (top), G (bottom) for instant positioning
- **Feature Toggle**: T (tree view), S (schema), D (debug), etc.

## Performance Optimization

### Caching Strategy
- **LRU Cache**: `src/core/utils/lruCache.ts` provides efficient caching with automatic eviction
- **Schema Inference**: Cached with 200-entry LRU cache to prevent redundant processing
- **Debug Log Formatting**: Cached with 1000-entry LRU cache for improved rendering
- **React Memoization**: Strategic use of `React.memo`, `useMemo`, and `useCallback`

### Algorithm Optimizations
- **Tree Filtering**: Optimized from array methods to for-loops for large datasets
- **Search Performance**: Efficient text matching with early returns
- **Memory Management**: Controlled object creation and garbage collection

### Performance Testing
- **Comprehensive Benchmarks**: 11 performance tests covering all major operations
- **Memory Usage Monitoring**: Automated tests to prevent memory leaks
- **CI/CD Integration**: Performance regression detection in build pipeline

## Configuration System

### YAML Configuration
- **Location**: `~/.config/jsont/config.yaml`
- **Hot Reloading**: Configuration changes applied without restart
- **Validation**: Zod-based schema validation with helpful error messages
- **Merging**: Deep merge with default configuration

### Configuration Structure
```yaml
display:
  interface:
    showLineNumbers: boolean
    useUnicodeTree: boolean
  json:
    indent: number
    useTabs: boolean
  tree:
    showArrayIndices: boolean
    showPrimitiveValues: boolean
    maxValueLength: number

keybindings:
  navigation:
    up: string
    down: string
    pageUp: string
    pageDown: string
```

## Testing Strategy

- **Comprehensive Coverage**: 150+ tests across all utilities and components
- **Test Types**: Unit tests for utilities, integration tests for components, performance tests
- **Test Environment**: Node.js environment with Vitest globals
- **Patterns**: Feature-specific test suites with clear scenarios
- **Coverage**: v8 provider with text, JSON, and HTML reporting
- **Performance Tests**: Automated benchmarking to prevent regressions

## Common Development Patterns

### Feature Development
1. Create feature directory with `components/`, `types/`, `utils/` structure
2. Implement core logic in utils with comprehensive tests
3. Build React components using Ink primitives
4. Add keyboard handlers and integrate with App.tsx
5. Export types and utilities via barrel files

### Adding New View Modes
1. Create feature-specific state management
2. Implement keyboard handler registration pattern
3. Add mode toggle logic to App.tsx
4. Use conditional rendering for mode switching
5. Follow existing patterns for search integration

### Keyboard Handler Integration
```typescript
// In feature component
const handleKeyboardInput = useCallback((input: string, key: KeyboardInput) => {
  // Handle feature-specific keys
  return handled;
}, []);

// Register with parent
useEffect(() => {
  if (onKeyboardHandlerReady) {
    onKeyboardHandlerReady(handleKeyboardInput);
  }
}, [onKeyboardHandlerReady, handleKeyboardInput]);
```