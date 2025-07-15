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
- `npm run build` - Bundle the application using tsup (supports extensionless imports)
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

#### Common Components Layer (**Unified Architecture**)
- **TextInput** (`src/features/common/components/TextInput.tsx`): **Unified text input system**
  - Single source of truth for all text input handling
  - Comprehensive Emacs-style keyboard shortcuts (Ctrl+K/U/W/D/A/E/F/B)
  - Platform-aware delete behavior (macOS vs other platforms)
  - Legacy compatibility layer for backward compatibility
  - Consolidated from previous `utils/textInput.ts` duplication

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

#### Simplified Input System
- **Ink useInput Hook**: Primary and exclusive keyboard handling system
- **TTY Stream Management**: Direct TTY access via `/dev/tty` for pipe mode compatibility
- **Clean Architecture**: Removed dual system complexity for better maintainability

### Navigation System

#### Comprehensive Navigation Features
The application provides multiple navigation methods for efficient JSON browsing:

1. **Line Navigation**: 
   - `j`: Scroll down one line
   - `k`: Scroll up one line
   - Precise control for detailed examination

2. **Page Navigation**:
   - `Ctrl+f`: Scroll down half a page (forward)
   - `Ctrl+b`: Scroll up half a page (backward)
   - Efficient movement through large content

3. **Goto Navigation**:
   - `gg`: Jump to top of file (vi-style double 'g' sequence)
   - `G`: Jump to bottom of file
   - Instant positioning for large files

#### Scrolling Architecture

##### Line-Based Scrolling
- **Granular Control**: Single-line scrolling for precise navigation
- **Boundary Management**: Automatic scroll limits based on content size
- **Performance**: Efficient rendering with visible line calculation

##### Goto Sequence Handling
- **Smart Timeout**: gg sequence resets after 1 second
- **State Management**: React state tracks sequence progress
- **Memory Cleanup**: Proper timeout cleanup on unmount

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
- **Import Guidelines**: 
  - **Always use extensionless imports** for TypeScript files
  - Example: `import { helper } from "./utils/helper"` ✅
  - Example: `import { helper } from "./utils/helper.ts"` ❌
  - Node.js resolution handles extension inference automatically
  - tsup bundler optimizes extensionless imports for better compatibility
- Built with tsup for optimal bundling and modern module support

### Ink Framework
- React-based TUI framework for terminal applications (v6.0+)
- TTY detection prevents input conflicts when reading from pipes
- Components use Ink's `Box` and `Text` for layout and styling

### State Management (2024 Architecture)
- **Jotai 2.0+** for atomic state management
- Atomic design with primitive and derived atoms
- Persistent atoms for configuration and history
- Optimized for CLI application performance

### JSON Syntax Highlighting

#### Advanced Color Coding
The JsonViewer component provides comprehensive syntax highlighting:

1. **Structural Characters**:
   - **Objects**: `{}` displayed in magenta
   - **Arrays**: `[]` displayed in cyan
   - **Enhanced distinction** between object and array boundaries

2. **Data Types**:
   - **Strings**: Green color with quote preservation
   - **Numbers**: Cyan color for numeric values
   - **Booleans**: Yellow color for true/false
   - **Null values**: Gray color for null

3. **Key-Value Pairs**:
   - **Keys**: Blue color for object property names
   - **Mixed content**: Proper handling of lines like `"array": [`
   - **Trailing commas**: Correct highlighting of `],` and `},` patterns

#### Rendering Optimizations
- **Line-by-line rendering**: Efficient display of large JSON files
- **Scrolling viewport**: Only visible lines are processed
- **Smart parsing**: Handles complex nested structures and edge cases

### Testing
- Vitest for unit testing with TypeScript support
- Tests focus on utility functions (JSON parsing, formatting, text input)
- Component testing for JsonViewer, App, and TextInput functionality
- Test files use `.test.ts` suffix and are co-located with source
- **Current test coverage: 345+ tests across 25 test suites**
- **Comprehensive TextInput testing**: 27 test cases covering all keyboard shortcuts, edge cases, and platform behavior

### Development Tools
- Biome for linting and formatting (recommended rules only)
- Husky + lint-staged for pre-commit quality checks
- Import organization automatically handled by Biome

## Coding Guidelines

### Import Standards (Updated 2025)
- **ALWAYS use extensionless imports** for TypeScript files
- **ALWAYS use TypeScript path aliases** for cross-feature imports
- **Correct**: `import { JsonValue } from "@core/types"`
- **Correct**: `import { TextInput } from "@features/common/components/TextInput"`
- **Incorrect**: `import { JsonValue } from "../types/index.ts"`
- **Incorrect**: `import { TextInput } from "../../../features/common/components/TextInput"`

### File Organization
- Use descriptive filenames without unnecessary extensions in imports
- **Organize imports by priority**: external libraries → @aliases → relative imports
- **Group by functionality**, not alphabetically
- Use barrel exports (`index.ts`) for clean module interfaces

### Import Organization Best Practices
```typescript
// 1. External libraries (React, Ink, etc.)
import { Box, Text, useInput } from "ink";
import { useCallback, useEffect, useState } from "react";

// 2. Core aliases (@core/*)
import type { AppProps } from "@core/types/app";

// 3. Feature aliases (@features/*) - grouped by functionality
import { JsonViewer } from "@features/json-rendering/components/JsonViewer";
import { handleTextInput } from "@features/common/components/TextInput";
import { SearchBar } from "@features/search/components/SearchBar";

// 4. Relative imports (within same feature only)
import { formatData } from "./utils/formatter";
```

### TypeScript Best Practices
- Leverage strict mode configuration for maximum type safety
- Use optional chaining (`?.`) instead of non-null assertions (`!`) for better safety
- Define proper type interfaces instead of using `any` type
- Utilize modern ES Module syntax consistently

### Text Input System (Unified Architecture)

**Location**: `@features/common/components/TextInput`

The TextInput system provides a unified, comprehensive solution for all text input handling across the application.

#### Key Components
```typescript
// Core functions
handleTextInput()           // Unified keyboard event handler
renderTextWithCursor()      // Display utility for cursor rendering
useTextInput()              // React hook for text input state
TextInput                   // Complete UI component

// Compatibility layer
convertLegacyState()        // Legacy → new state format
convertToLegacyState()      // New → legacy state format
```

#### Keyboard Shortcuts (Emacs-style)
```typescript
// Cursor Movement
Ctrl+A, Home    // Move to beginning of line
Ctrl+E, End     // Move to end of line  
Ctrl+F, →       // Move cursor forward
Ctrl+B, ←       // Move cursor backward

// Text Deletion
Ctrl+K          // Delete from cursor to end of line (kill-line)
Ctrl+U          // Delete from beginning to cursor (unix-line-discard)
Ctrl+W          // Delete word backward (backward-kill-word)
Ctrl+D          // Delete character at cursor (delete-char)

// Standard Operations
Backspace       // Delete character before cursor
Delete          // Platform-aware deletion (macOS vs others)
```

#### Usage Examples
```typescript
// In React components
import { useTextInput, TextInputProps } from "@features/common/components/TextInput";

// For custom input handling
import { handleTextInput, TextInputState, TextInputActions } from "@features/common/components/TextInput";

// For display utilities
import { renderTextWithCursor } from "@features/common/components/TextInput";
```

### Error Handling with neverthrow
- **Result Type Pattern**: Use `Result<T, E>` for safe error handling instead of throwing exceptions
- **Safe Operations**: All potentially failing operations return `Result` types
- **Error Recovery**: Comprehensive error types with context and recovery suggestions
- **Example Usage**:
  ```typescript
  import { parseJsonSafely } from "./utils/result";
  
  const result = parseJsonSafely(input);
  result.match(
    (data) => console.log("Success:", data),
    (error) => console.error("Error:", error.message)
  );
  ```

## Important Notes

### Git Workflow

#### Starting New Work (MANDATORY)
**⚠️ CRITICAL: Always follow this workflow before starting any new task or feature implementation:**

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

#### **For Claude Code Users**
**🤖 IMPORTANT: Claude Code must ALWAYS create a new branch before implementing any feature, fix, or change:**

- **Before writing ANY code**: Check current branch with `git branch` or `git status`
- **If on master**: Immediately create a new branch following the workflow above
- **If on existing branch**: Confirm it's the appropriate branch for the current task
- **Never commit directly to master**: All work must be done on feature branches
- **One branch per feature**: Each distinct feature or fix should have its own branch

#### Benefits of This Workflow
- **Prevents conflicts** - Always start from latest master
- **Clean history** - Avoids unnecessary merge commits
- **Clear PRs** - Only relevant changes included
- **Easy reviews** - Clear diff visualization
- **Safe experimentation** - Master branch remains stable
- **Parallel development** - Multiple features can be developed simultaneously

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

---

# 🚨 CRITICAL INSTRUCTIONS FOR CLAUDE CODE

## ⚠️ MANDATORY BRANCH WORKFLOW
**Before implementing ANY feature, fix, or change, you MUST:**

1. **Check current branch**: `git status` or `git branch`
2. **If on master**: Create new branch immediately
3. **If on wrong branch**: Switch to appropriate branch or create new one
4. **NEVER commit to master**: All work must be on feature branches

### Quick Branch Creation Command
```bash
git checkout master && git pull origin master && git checkout -b feature/descriptive-name
```

### Branch Naming Examples
- `feature/search-functionality`
- `fix/json-parsing-error`
- `docs/update-readme`
- `refactor/clean-components`

## 🎯 Implementation Guidelines
- **One branch per task**: Each feature/fix gets its own branch
- **Descriptive names**: Branch names should clearly indicate the work being done
- **Start from latest master**: Always pull latest changes before creating branch
- **Clean history**: Avoid mixing unrelated changes in same branch

**Failure to follow this workflow will result in messy git history and difficult code reviews.**

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## 🚨 Critical Import Guidelines

### 📁 Import Path Standards

**MANDATORY**: Always use extensionless imports for TypeScript files
- ✅ Correct: `import { Component } from "./components/Component"`
- ❌ Wrong: `import { Component } from "./components/Component.ts"`
- ❌ Wrong: `import { Component } from "./components/Component.tsx"`

**MANDATORY**: Always use TypeScript path aliases for cleaner imports
- ✅ Correct: `import { JsonViewer } from "@features/json-rendering/components/JsonViewer"`
- ✅ Correct: `import { AppProps } from "@core/types/app"`
- ❌ Wrong: `import { JsonViewer } from "../../../features/json-rendering/components/JsonViewer"`
- ❌ Wrong: `import { AppProps } from "../../core/types/app"`

### 🗂️ Available Path Aliases
```typescript
// Core aliases
@core/*           → src/core/*
@features/*       → src/features/*

// Specific feature aliases (examples)
@features/json-rendering/*  → src/features/json-rendering/*
@features/collapsible/*     → src/features/collapsible/*
@features/search/*          → src/features/search/*
@features/jq/*              → src/features/jq/*
@features/schema/*          → src/features/schema/*
@features/status/*          → src/features/status/*
@features/debug/*           → src/features/debug/*
@features/common/*          → src/features/common/*
```

### 📋 Import Best Practices
1. **Use aliases for all cross-feature imports**
2. **Use relative imports only within the same feature directory**
3. **Organize imports by: external → aliases → relative**
4. **Group by functionality, not alphabetically**

### ✅ Example of Proper Import Structure
```typescript
// External libraries first
import { Box, Text, useInput } from "ink";
import { useCallback, useEffect, useState } from "react";

// Core aliases
import type { AppProps } from "@core/types/app";

// Feature aliases (organized by functionality)
import { JsonViewer } from "@features/json-rendering/components/JsonViewer";
import { SearchBar } from "@features/search/components/SearchBar";
import { handleTextInput } from "@features/common/components/TextInput";

// Relative imports last (within same feature)
import { formatJsonSchema } from "./utils/schemaUtils";
```

### 🚫 Import Anti-patterns
```typescript
// ❌ DON'T: Mix aliases with relative paths
import { JsonViewer } from "@features/json-rendering/components/JsonViewer";
import { SearchBar } from "../../../search/components/SearchBar";

// ❌ DON'T: Use relative paths for cross-feature imports
import { handleTextInput } from "../../../common/components/TextInput";

// ❌ DON'T: Use file extensions
import { JsonViewer } from "@features/json-rendering/components/JsonViewer.tsx";
```

This is essential for:
- Modern bundler compatibility (tsup)
- Consistent code style across the project
- Avoiding build issues and import resolution problems
- Better code readability and maintainability
- Easier refactoring and code organization