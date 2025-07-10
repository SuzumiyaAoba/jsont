/**
 * Tests for application constants
 */

import { describe, expect, it } from "vitest";
import { CONFIG, DEBUG_PREFIX, MESSAGES } from "./constants";

describe("Application Constants", () => {
  describe("CONFIG object", () => {
    it("should have input configuration", () => {
      expect(CONFIG.INPUT_TIMEOUT).toBe(10000);
      expect(typeof CONFIG.INPUT_TIMEOUT).toBe("number");
      expect(CONFIG.INPUT_TIMEOUT).toBeGreaterThan(0);
    });

    it("should have reasonable max file size", () => {
      expect(CONFIG.MAX_FILE_SIZE).toBe(50 * 1024 * 1024); // 50MB
      expect(typeof CONFIG.MAX_FILE_SIZE).toBe("number");
      expect(CONFIG.MAX_FILE_SIZE).toBeGreaterThan(0);
    });

    it("should have keep alive interval", () => {
      expect(CONFIG.KEEP_ALIVE_INTERVAL).toBe(1000);
      expect(typeof CONFIG.KEEP_ALIVE_INTERVAL).toBe("number");
      expect(CONFIG.KEEP_ALIVE_INTERVAL).toBeGreaterThan(0);
    });

    it("should have terminal control sequences", () => {
      expect(CONFIG.TERMINAL).toBeDefined();
      expect(typeof CONFIG.TERMINAL).toBe("object");
      expect(CONFIG.TERMINAL.CLEAR_SCREEN).toContain("\x1b");
      expect(CONFIG.TERMINAL.HIDE_CURSOR).toContain("\x1b");
      expect(CONFIG.TERMINAL.SHOW_CURSOR).toContain("\x1b");
    });

    it("should have exit codes", () => {
      expect(CONFIG.EXIT_CODES.SUCCESS).toBe(0);
      expect(CONFIG.EXIT_CODES.ERROR).toBe(1);
    });
  });

  describe("MESSAGES object", () => {
    it("should have user-facing messages", () => {
      expect(MESSAGES.NO_INPUT).toBe("No JSON input provided.");
      expect(typeof MESSAGES.NO_INPUT).toBe("string");
      expect(MESSAGES.NO_INPUT.length).toBeGreaterThan(0);
    });

    it("should have usage message", () => {
      expect(MESSAGES.USAGE).toContain("jsont");
      expect(typeof MESSAGES.USAGE).toBe("string");
    });

    it("should have error messages", () => {
      expect(MESSAGES.UNKNOWN_ERROR).toBeDefined();
      expect(MESSAGES.FATAL_ERROR).toBeDefined();
      expect(typeof MESSAGES.UNKNOWN_ERROR).toBe("string");
      expect(typeof MESSAGES.FATAL_ERROR).toBe("string");
    });
  });

  describe("DEBUG_PREFIX", () => {
    it("should have debug prefix constant", () => {
      expect(DEBUG_PREFIX).toBe("DEBUG:");
      expect(typeof DEBUG_PREFIX).toBe("string");
    });
  });

  describe("Constants as const", () => {
    it("should be properly typed as const", () => {
      // Verify that constants maintain their original values
      expect(CONFIG.INPUT_TIMEOUT).toBe(10000);
      expect(typeof CONFIG.INPUT_TIMEOUT).toBe("number");
    });

    it("should have nested objects as const", () => {
      expect(CONFIG.TERMINAL.CLEAR_SCREEN).toBe("\x1b[2J\x1b[H");
      expect(CONFIG.EXIT_CODES.SUCCESS).toBe(0);
    });
  });
});
