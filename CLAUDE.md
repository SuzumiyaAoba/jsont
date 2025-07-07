# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `jsont`, a Terminal User Interface (TUI) JSON viewer built with React and Ink. The application reads JSON data from stdin and displays it in a colorized, hierarchical format in the terminal.

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration with the following jobs:

- **Lint and Format**: Runs Biome checks for code quality
- **Type Check**: Validates TypeScript types across all files
- **Test**: Runs comprehensive test suite on Node.js 18, 20, and 22
- **Build**: Compiles TypeScript and tests the built application
- **Security**: Performs dependency audits and security scans
- **Publish**: Dry-run package publishing (master branch only)

All pull requests must pass CI checks before merging.

## Key Commands

### Development
- `npm run dev` - Run the application in development mode using tsx
- `npm run build` - Compile TypeScript to JavaScript in the `dist/` directory
- `npm run start` - Run the compiled application from `dist/index.js`

### Testing
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once and exit
- `npm run test:ui` - Open Vitest UI for interactive testing

### Code Quality
- `npm run check` - Run Biome linter and formatter checks
- `npm run check:write` - Run Biome checks and apply safe fixes
- `npm run lint` - Lint source code only
- `npm run format:write` - Format source code

### Usage
```bash
echo '{"key": "value"}' | npm run dev
cat file.json | npm run dev
```

### Keyboard Controls

#### Global Controls
- **q**: Quit the application 
- **Ctrl+C**: Exit the application

#### Navigation Controls (Available in all modes)
- **j**: Scroll down one line
- **k**: Scroll up one line
- **Ctrl+f**: Scroll down half a page
- **Ctrl+b**: Scroll up half a page
- **gg**: Go to the top of the file (first 'g', then second 'g' within 1 second)
- **G**: Go to the bottom of the file

#### Input Mode Compatibility
- **Interactive Terminal Mode**: All keyboard controls work normally
- **Pipe Mode**: Navigation controls available via advanced TTY stream handling
- **File Input Mode**: All keyboard controls work normally

The application implements sophisticated stdin handling to enable keyboard navigation even when JSON data is provided via pipes (e.g., `echo '...' | jsont`), similar to how tools like `less` operate.

## Architecture

### Refactored Clean Architecture

#### Entry Point (`src/index.tsx`)
- Minimal entry point with proper error handling
- Delegates all logic to AppService
- Single responsibility: application bootstrapping

#### Services Layer
- **AppService** (`src/services/appService.ts`): Application lifecycle orchestration
- **JsonService** (`src/services/jsonService.ts`): JSON processing and validation

#### Utilities Layer
- **TerminalManager** (`src/utils/terminal.ts`): Terminal state and control sequences
- **ProcessManager** (`src/utils/processManager.ts`): Process lifecycle and keep-alive management
- **ErrorHandler** (`src/utils/errorHandler.ts`): Centralized error handling and recovery
- **DebugLogger** (`src/utils/debug.ts`): Structured debug logging
- **StdinHandler** (`src/utils/stdinHandler.ts`): Advanced stdin/pipe processing with TTY reinitialization
- **KeyboardHandler** (`src/utils/keyboardHandler.ts`): Custom keyboard input system for pipe mode compatibility

#### Configuration
- **Constants** (`src/config/constants.ts`): All magic numbers, strings, and configuration
- **Types** (`src/types/app.ts`): Application-specific type definitions

#### UI Components
- **App** (`src/App.tsx`): Main React component with keyboard handling
- **StatusBar**: Status display and error messaging
- **JsonViewer**: JSON rendering with syntax highlighting

### Data Flow (Refactored)
1. `index.tsx` → `AppService.run()`
2. `AppService` → `JsonService.processInput()` for data processing
3. `AppService` → `TerminalManager.initialize()` for terminal setup
4. `AppService` → `ProcessManager.setup()` for lifecycle management
5. `AppService` renders `App` component with processed data
6. `App` → `JsonViewer` for display rendering

### Benefits of Refactoring
- **Separation of Concerns**: Each class has a single responsibility
- **Testability**: Services and utilities can be unit tested independently
- **Maintainability**: Clear interfaces and dependency injection
- **Type Safety**: Comprehensive TypeScript coverage
- **Configuration Management**: Centralized constants and configuration
- **Error Handling**: Consistent error handling across the application

## Navigation Implementation

### Advanced Stdin Handling

The application implements sophisticated stdin processing to enable keyboard navigation in all input modes:

#### Pipe Mode Navigation
- **Challenge**: When JSON data is piped (`echo '...' | jsont`), stdin is consumed for data input, preventing keyboard interaction
- **Solution**: Read-then-reinitialize strategy that restores keyboard input after JSON processing
- **Implementation**: 
  1. Completely read stdin data into memory
  2. Parse JSON content
  3. Create new TTY streams using `/dev/fd/0` or similar device files
  4. Replace `process.stdin` with new TTY stream for keyboard input
  5. Enable Ink framework compatibility with custom setRawMode handling

#### Fallback Strategy
The stdin handler implements multiple fallback approaches:
1. **Primary**: Open `/dev/tty` directly for terminal access
2. **Secondary**: Use `/dev/fd/0` or `/proc/self/fd/0` as TTY stream
3. **Fallback**: Reset existing `process.stdin` with TTY properties
4. **Minimal**: Create compatible stdin mock for Ink framework

#### Dual Input System
- **Ink useInput Hook**: Primary keyboard handling for standard cases
- **Custom KeyboardHandler**: Fallback system for complex pipe scenarios
- **Event Coordination**: Both systems use the same input handling logic

### Scrolling Architecture

#### Line-Based Scrolling
- **Granular Control**: Single-line scrolling for precise navigation
- **Boundary Management**: Automatic scroll limits based on content size
- **Performance**: Efficient rendering with visible line calculation

#### State Management
```typescript
const [scrollOffset, setScrollOffset] = useState<number>(0);
const maxScroll = Math.max(0, jsonLines - visibleLines);
```

#### React Optimization
- **useCallback**: Memoized input handlers prevent unnecessary re-renders
- **Minimal Dependencies**: Optimized useEffect dependencies reduce computation
- **Clean Rendering**: Eliminated debug output prevents screen flickering

## Technical Considerations

### TypeScript Configuration
- Uses ES Modules (`"type": "module"` in package.json)
- Extends `@tsconfig/strictest` for maximum type safety
- Bundler module resolution for modern import handling
- All imports must use `.js` extensions in source files

### Ink Framework
- React-based TUI framework for terminal applications (v6.0+)
- TTY detection prevents input conflicts when reading from pipes
- Components use Ink's `Box` and `Text` for layout and styling

### State Management (2024 Architecture)
- **Jotai 2.0+** for atomic state management
- Atomic design with primitive and derived atoms
- Persistent atoms for configuration and history
- Optimized for CLI application performance

### Testing
- Vitest for unit testing with TypeScript support
- Tests focus on utility functions (JSON parsing, formatting)
- Test files use `.test.ts` suffix and are co-located with source

### Development Tools
- Biome for linting and formatting (recommended rules only)
- Husky + lint-staged for pre-commit quality checks
- Import organization automatically handled by Biome

## Important Notes

### Git Workflow

#### Starting New Work (MANDATORY)
**Always follow this workflow before starting any new task:**

```bash
# 1. Switch to master branch
git checkout master

# 2. Fetch latest changes from remote
git fetch origin

# 3. Update local master to latest
git pull origin master

# 4. Create new feature branch
git checkout -b feature/descriptive-name

# 5. Begin work
```

#### Benefits of This Workflow
- **Prevents conflicts** - Always start from latest master
- **Clean history** - Avoids unnecessary merge commits
- **Clear PRs** - Only relevant changes included
- **Easy reviews** - Clear diff visualization

#### Commit Guidelines
- **Never use `--no-verify` flag** when committing
- Pre-commit hooks run `biome check --write` automatically
- If lint errors occur, fix them first using `npm run check:write`
- Commit only after all quality checks pass
- Use descriptive commit messages following conventional commits format

#### Branch Naming Convention
- `feat/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation changes
- `refactor/component-name` - Code refactoring
- `test/test-description` - Test additions/updates

### Known Lint Exceptions
- `any` types are intentionally used for JSON data handling since the application processes arbitrary JSON
- Array index keys in JsonViewer are acceptable for this static rendering use case

## Development Methodology

### Feature-Driven Development Approach

**Core Principle**: Build incrementally working features rather than component-by-component.

#### Development Flow
1. **Start with Simplest Working Feature**
   - Implement minimal viable functionality
   - Ensure it works end-to-end
   - Add comprehensive tests
   - Commit and merge

2. **Iterative Enhancement**
   - Add one feature at a time
   - Each iteration should be demonstrable
   - Maintain backward compatibility
   - Focus on user value

#### Feature Implementation Strategy

**Phase 1: MVP Features** ✅ COMPLETED
- **F1**: Basic JSON display (read from stdin, show formatted output) ✅
- **F2**: Advanced navigation with pipe mode support (j/k scroll, TTY stream handling) ✅
- **F3**: Basic filtering (simple path-based search) 🚧 PLANNED

**Phase 2: Core Features**
- **F4**: Enhanced JSON parsing (JSON5 support, error recovery)
- **F5**: Interactive navigation (keyboard shortcuts, expand/collapse)
- **F6**: Advanced filtering (jq/JSONata integration)

**Phase 3: Polish Features**
- **F7**: Theming system (dark/light modes)
- **F8**: Data operations (copy, export)
- **F9**: Accessibility improvements

#### Benefits of Feature-Driven Approach
- **Immediate Value**: Each iteration provides working functionality
- **Risk Reduction**: Early validation of architecture decisions
- **User Feedback**: Enable early user testing and feedback
- **Parallel Development**: Multiple features can be developed simultaneously
- **Easier Debugging**: Isolated feature implementation reduces complexity

#### Implementation Guidelines
- **Small PRs**: Each feature should be ~300-500 lines including tests
- **Working Software**: Every merge should result in functional software
- **Test Coverage**: Maintain >80% test coverage per feature
- **Documentation**: Update docs with each feature addition
- **Performance**: Each feature must meet performance targets

#### Git Workflow for Features
```bash
# Start new feature
git checkout master
git pull origin master
git checkout -b feature/f1-basic-json-display

# Implement feature incrementally
# Each commit should be a working state
git commit -m "feat: add basic JSON parsing"
git commit -m "feat: add simple display rendering"
git commit -m "feat: add stdin input handling"
git commit -m "test: add comprehensive F1 tests"

# Create PR when feature is complete
gh pr create --title "Feature F1: Basic JSON Display"
```