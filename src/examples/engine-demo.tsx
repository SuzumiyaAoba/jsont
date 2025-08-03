#!/usr/bin/env node

/**
 * Engine Architecture Demo
 * Demonstrates the new UI-agnostic JSON processing engines
 */

import { EngineBasedApp } from "@components/EngineBasedApp";
import type { JsontConfig } from "@core/config/types";
import { ConfigProvider } from "@core/context/ConfigContext";
import { render } from "ink";

// Sample JSON data for demonstration
const sampleData = {
  name: "Engine Architecture Demo",
  version: "1.0.0",
  features: {
    engines: [
      {
        name: "JsonEngine",
        description: "Central orchestrator for JSON operations",
        capabilities: ["parsing", "validation", "transformation", "export"],
      },
      {
        name: "TreeEngine",
        description: "UI-agnostic tree processing",
        capabilities: ["navigation", "expansion", "filtering", "rendering"],
      },
      {
        name: "SearchEngine",
        description: "UI-agnostic search functionality",
        capabilities: ["search", "navigation", "history", "scoping"],
      },
    ],
    adapters: [
      {
        name: "TUIAdapter",
        description: "Terminal User Interface adapter",
        status: "implemented",
      },
      {
        name: "WebUIAdapter",
        description: "Web User Interface adapter",
        status: "planned",
      },
    ],
  },
  benefits: [
    "Separation of concerns",
    "Multiple UI support",
    "Enhanced testability",
    "Future GUI ready",
    "Improved maintainability",
  ],
  metadata: {
    created: "2024-01-01T00:00:00Z",
    lastModified: "2024-01-15T12:30:00Z",
    authors: ["Claude Code", "Architecture Team"],
    tags: ["ui-agnostic", "engines", "architecture", "json-processing"],
  },
};

// Default configuration
const defaultConfig: JsontConfig = {
  display: {
    interface: {
      showLineNumbers: true,
      debugMode: false,
      defaultHeight: 30,
      showStatusBar: true,
    },
    json: {
      indent: 2,
      useTabs: false,
      maxLineLength: 120,
    },
    tree: {
      showArrayIndices: true,
      showPrimitiveValues: true,
      maxValueLength: 100,
      useUnicodeTree: true,
      showSchemaTypes: false,
    },
  },
  keybindings: {
    navigation: {
      up: ["k"],
      down: ["j"],
      pageUp: ["ctrl+b"],
      pageDown: ["ctrl+f"],
      top: ["g"],
      bottom: ["G"],
    },
    modes: {
      search: ["/"],
      schema: ["3"],
      tree: ["1"],
      collapsible: ["2"],
      jq: ["j"],
      lineNumbers: ["L"],
      debug: ["4"],
      help: ["?"],
      export: ["e"],
      exportData: ["E"],
      quit: ["q"],
    },
    search: {
      next: ["n"],
      previous: ["N"],
      exit: ["escape"],
    },
  },
  behavior: {
    search: {
      caseSensitive: false,
      regex: false,
      highlight: true,
    },
    navigation: {
      halfPageScroll: true,
      autoScroll: true,
      scrollOffset: 3,
    },
  },
};

/**
 * Main demo application
 */
function Demo() {
  return (
    <ConfigProvider config={defaultConfig}>
      <EngineBasedApp
        initialData={sampleData}
        config={defaultConfig}
        dimensions={{
          width: Math.min(120, process.stdout.columns || 120),
          height: Math.min(30, process.stdout.rows || 30),
        }}
      />
    </ConfigProvider>
  );
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🚀 Starting Engine Architecture Demo...");
  console.log("📋 Controls:");
  console.log("  1-4: Switch view modes (Tree, Raw, Schema, Debug)");
  console.log("  /: Toggle search mode");
  console.log("  j/k: Navigate up/down in tree");
  console.log("  Space: Toggle node expansion");
  console.log("  t: Toggle schema types");
  console.log("  L: Toggle line numbers");
  console.log("  Ctrl+Q: Quit");
  console.log("");

  const { unmount } = render(<Demo />);

  // Handle graceful shutdown
  const handleExit = () => {
    unmount();
    console.log("\n👋 Engine Architecture Demo ended.");
    process.exit(0);
  };

  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit);
}

export default Demo;
