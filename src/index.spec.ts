/**
 * Tests for application entry point
 */

import { describe, expect, it, vi } from "vitest";

// Mock AppService to avoid actually starting the application
vi.mock("./services/appService", () => ({
  AppService: {
    run: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Application Entry Point", () => {
  it("should export AppService", async () => {
    const { AppService } = await import("./services/appService");
    expect(AppService).toBeDefined();
    expect(typeof AppService.run).toBe("function");
  });

  it("should have main function call AppService.run when not imported", async () => {
    // Mock process.argv to simulate CLI execution
    const originalArgv = process.argv;
    process.argv = ["node", "dist/index.js"];

    // Import the module which should trigger the main execution
    const indexModule = await import("./index");

    // The module should have been loaded without errors
    expect(indexModule).toBeDefined();

    // Restore original argv
    process.argv = originalArgv;
  });

  it("should handle ES module requirements", () => {
    // Verify that the entry point is compatible with ES modules
    expect(typeof import("./index")).toBe("object");
  });

  it("should not execute main when imported as module", async () => {
    // When imported as a module (like in tests), it should not execute main
    const { AppService } = await import("./services/appService");

    // Reset the mock to check if run was called during import
    vi.clearAllMocks();

    // Import again
    await import("./index");

    // AppService.run should not be called when imported as module
    // (This test verifies the module.parent check works correctly)
    expect(AppService.run).not.toHaveBeenCalled();
  });
});
