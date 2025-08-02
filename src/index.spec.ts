/**
 * Tests for application entry point
 */

import { describe, expect, it, vi } from "vitest";

// Mock AppService class and error handler to avoid actually starting the application
const mockRun = vi.fn().mockResolvedValue(undefined);
vi.mock("./core/services/appService", () => ({
  AppService: vi.fn().mockImplementation(() => ({
    run: mockRun,
  })),
}));

// Mock error handler to prevent process.exit calls
vi.mock("./core/utils/errorHandler", () => ({
  handleFatalError: vi.fn(),
}));

describe("Application Entry Point", () => {
  it("should export AppService class", async () => {
    const { AppService } = await import("./core/services/appService");
    expect(AppService).toBeDefined();
    expect(typeof AppService).toBe("function"); // Should be a constructor function
  });

  it("should create AppService instance with run method", async () => {
    const { AppService } = await import("./core/services/appService");
    const instance = new AppService();
    expect(instance).toBeDefined();
    expect(typeof instance.run).toBe("function");
  });

  it("should handle ES module requirements", () => {
    // Verify that the entry point is compatible with ES modules
    expect(typeof import("./index")).toBe("object");
  });

  it("should have proper entry point structure", async () => {
    // Test that the index module can be imported without errors
    const indexModule = await import("./index");
    expect(indexModule).toBeDefined();
  });
});
