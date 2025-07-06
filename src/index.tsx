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

  // Render the application with data or error
  const renderOptions: any = {
    stdout: process.stdout,
    stderr: process.stderr,
  };

  // Only enable stdin in interactive mode to avoid raw mode issues
  if (process.stdin.isTTY) {
    renderOptions.stdin = process.stdin;
  }

  const app = render(
    <App initialData={jsonData} initialError={errorMessage} />,
    renderOptions,
  );

  // Auto-exit in pipe mode after rendering (stdin pipe without file arg)
  if (!process.stdin.isTTY && !process.argv[2]) {
    // Wait a moment for rendering to complete, then exit
    setTimeout(() => {
      app.unmount();
      process.exit(0);
    }, 100);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
