/**
 * CLI Argument Parser
 * Handles command line argument parsing for jsont
 */

import type { CliArgs } from "@core/types/app";
import { VIEW_MODES, type ViewMode } from "@core/types/index";
import { includes } from "es-toolkit/compat";

/**
 * Parse command line arguments
 */
export function parseCliArgs(argv: string[] = process.argv): CliArgs {
  const args = argv.slice(2); // Remove 'node' and script path
  const result: CliArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--version" || arg === "-v") {
      result.version = true;
    } else if (arg === "--mode" || arg === "-m") {
      const mode = args[i + 1];
      if (!mode) {
        throw new Error(
          "--mode option requires a value. Valid modes: raw, tree, collapsible, schema, settings",
        );
      }
      if (isValidViewMode(mode)) {
        result.viewMode = mode;
        i++; // Skip next argument as it's the mode value
      } else {
        throw new Error(
          `Invalid view mode: ${mode}. Valid modes: raw, tree, collapsible, schema, settings`,
        );
      }
    } else if (arg === "--tree" || arg === "-t") {
      result.viewMode = "tree";
    } else if (arg === "--collapsible" || arg === "-c") {
      result.viewMode = "collapsible";
    } else if (arg === "--schema" || arg === "-s") {
      result.viewMode = "schema";
    } else if (arg === "--settings") {
      result.viewMode = "settings";
    } else if (arg && !arg.startsWith("-")) {
      // Treat as file path if it doesn't start with '-'
      result.filePath = arg;
    } else if (arg) {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return result;
}

/**
 * Check if a string is a valid view mode
 */
function isValidViewMode(mode: string): mode is ViewMode {
  return includes(VIEW_MODES, mode as ViewMode);
}

/**
 * Display help information
 */
export function showHelp(): void {
  console.log(`
jsont - Terminal JSON Viewer

USAGE:
    jsont [OPTIONS] [FILE]

OPTIONS:
    -h, --help              Show this help message
    -v, --version           Show version information
    -m, --mode <MODE>       Set initial view mode
    -t, --tree              Start in tree view mode
    -c, --collapsible       Start in collapsible view mode
    -s, --schema            Start in schema view mode
    --settings              Start in settings mode

VIEW MODES:
    raw                     Default JSON view with syntax highlighting
    tree                    Interactive tree navigation view
    collapsible             Collapsible JSON structure view
    schema                  JSON schema inference and display
    settings                Application settings interface

EXAMPLES:
    echo '{"key": "value"}' | jsont
    jsont data.json
    jsont --tree data.json
    jsont --mode schema data.json
    cat data.json | jsont --collapsible

KEYBOARD SHORTCUTS:
    ?                       Show help and keyboard shortcuts
    q                       Quit application
    T                       Toggle tree view
    C                       Toggle collapsible view
    S                       Toggle schema view
    P                       Open settings (Preferences)
    /                       Start search
    j/k, ↑/↓               Navigate up/down
    Ctrl+f/b               Page up/down
    gg, G                  Go to top/bottom
`);
}

/**
 * Display version information
 */
export function showVersion(): void {
  // Try to read package.json version
  try {
    const fs = require("node:fs");
    const path = require("node:path");
    const packagePath = path.join(__dirname, "../../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    console.log(`jsont v${packageJson.version}`);
  } catch {
    console.log("jsont v1.0.0");
  }
}
