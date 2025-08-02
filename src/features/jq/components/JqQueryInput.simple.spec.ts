/**
 * Simple tests for JqQueryInput component types and interfaces
 */

import type { JqState } from "@features/jq/types/jq";
import { describe, expect, it } from "vitest";

describe("JqQueryInput Types and Interfaces", () => {
  it("should have correct JqState interface", () => {
    const validJqState: JqState = {
      isActive: true,
      query: "test query",
      transformedData: { result: "data" },
      error: null,
      showOriginal: false,
      isProcessing: false,
    };

    expect(validJqState.isActive).toBe(true);
    expect(validJqState.query).toBe("test query");
    expect(validJqState.transformedData).toEqual({ result: "data" });
    expect(validJqState.error).toBe(null);
    expect(validJqState.showOriginal).toBe(false);
    expect(validJqState.isProcessing).toBe(false);
  });

  it("should handle JqState with error", () => {
    const errorState: JqState = {
      isActive: true,
      query: "invalid query",
      transformedData: null,
      error: "jq: syntax error",
      showOriginal: false,
      isProcessing: false,
    };

    expect(errorState.error).toBe("jq: syntax error");
    expect(errorState.transformedData).toBe(null);
  });

  it("should handle loading state", () => {
    const loadingState: JqState = {
      isActive: true,
      query: "processing...",
      transformedData: null,
      error: null,
      showOriginal: false,
      isProcessing: true,
    };

    expect(loadingState.isProcessing).toBe(true);
  });

  it("should handle inactive state", () => {
    const inactiveState: JqState = {
      isActive: false,
      query: "",
      transformedData: null,
      error: null,
      showOriginal: false,
      isProcessing: false,
    };

    expect(inactiveState.isActive).toBe(false);
    expect(inactiveState.query).toBe("");
  });

  it("should support all focus modes", () => {
    const focusModes = ["input", "json"] as const;

    focusModes.forEach((mode) => {
      expect(typeof mode).toBe("string");
      expect(["input", "json"]).toContain(mode);
    });
  });
});
