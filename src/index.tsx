#!/usr/bin/env node
import { render } from "ink";
import { App } from "./App.js";
import { autoReadJson } from "./utils/stdinReader.js";

async function main() {
  let jsonData = null;
  let errorMessage: string | null = null;

  // Check for file argument
  const filePath = process.argv[2];

  try {
    const result = await autoReadJson(filePath, {
      timeout: 10000, // 10 seconds
      maxSize: 50 * 1024 * 1024, // 50MB
      extractFromText: true, // Enable JSON extraction from text
    });

    if (result.success) {
      jsonData = result.data;

      // Log stats in debug mode
      if (process.env["DEBUG"]) {
        console.error(
          `Read ${result.stats.bytesRead} bytes from ${result.stats.source} in ${result.stats.readTime.toFixed(2)}ms`,
        );
      }
    } else {
      errorMessage = result.error;

      // Only exit with error if we have a terminal (interactive mode)
      if (process.stdin.isTTY && !filePath) {
        console.error("No JSON input provided.");
        console.error("Usage: jsont [file.json] or echo '{...}' | jsont");
        process.exit(1);
      }
    }
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    if (process.stdin.isTTY && !filePath) {
      console.error("Error:", errorMessage);
      process.exit(1);
    }
  }

  // Clear screen and setup full terminal usage before rendering
  if (process.stdin.isTTY) {
    // Clear screen and move cursor to top
    process.stdout.write("\x1b[2J\x1b[H");
    // Hide cursor for cleaner display
    process.stdout.write("\x1b[?25l");
    // Enable alternative screen buffer for full terminal usage
    process.stdout.write("\x1b[?1049h");
  }

  // Render the application with data or error
  const renderOptions = {
    stdout: process.stdout,
    stderr: process.stderr,
    ...(process.stdin.isTTY && { stdin: process.stdin }),
  };

  const app = render(
    <App initialData={jsonData} initialError={errorMessage} />,
    renderOptions,
  );

  // Setup cleanup for terminal restoration
  const cleanup = () => {
    if (process.stdin.isTTY) {
      // Restore terminal state
      process.stdout.write("\x1b[?1049l"); // Disable alternative screen buffer
      process.stdout.write("\x1b[?25h"); // Show cursor
    }
  };

  // Handle app exit
  app.waitUntilExit().then(() => {
    cleanup();
  });

  // Handle process signals for proper cleanup
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });

  // Only auto-exit in pipe mode if there's no valid JSON data
  if (!process.stdin.isTTY && !process.argv[2] && !jsonData) {
    // Wait a moment for rendering to complete, then exit
    setTimeout(() => {
      cleanup();
      app.unmount();
      process.exit(0);
    }, 100);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
