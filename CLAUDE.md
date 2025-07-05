# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `jsont`, a Terminal User Interface (TUI) JSON viewer built with React and Ink. The application reads JSON data from stdin and displays it in a colorized, hierarchical format in the terminal.

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

## Architecture

### Entry Point (`src/index.tsx`)
- Handles stdin reading before React rendering
- Parses JSON input and passes to the App component
- Manages TTY detection to prevent conflicts with Ink's input handling

### Main Application (`src/App.tsx`)
- Central state management for JSON data, filters, and errors
- Keyboard input handling (Ctrl+C to exit)
- Orchestrates the three main UI components

### Component Architecture
- **StatusBar**: Displays application status and error messages
- **FilterInput**: Shows current filter state (planned for jq integration)
- **JsonViewer**: Recursive renderer for JSON data with syntax highlighting

### Data Flow
1. `index.tsx` reads from stdin and parses JSON
2. Parsed data passed as `initialData` to `App`
3. `App` manages state and passes data to `JsonViewer`
4. `JsonViever` recursively renders JSON with appropriate colors and formatting

## Technical Considerations

### TypeScript Configuration
- Uses ES Modules (`"type": "module"` in package.json)
- Node16 module resolution for proper import handling
- All imports must use `.js` extensions in source files

### Ink Framework
- React-based TUI framework for terminal applications
- TTY detection prevents input conflicts when reading from pipes
- Components use Ink's `Box` and `Text` for layout and styling

### State Management
- Currently uses basic React state
- Filter functionality is placeholder for future jq integration
- Error state managed at App level for global error display

### Testing
- Vitest for unit testing with TypeScript support
- Tests focus on utility functions (JSON parsing, formatting)
- Test files use `.test.ts` suffix and are co-located with source

### Development Tools
- Biome for linting and formatting (recommended rules only)
- Husky + lint-staged for pre-commit quality checks
- Import organization automatically handled by Biome