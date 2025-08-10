/**
 * Tests for TerminalManager utility
 */

import { CONFIG } from "@core/config/constants";
import { TerminalManager } from "@core/utils/terminal";

describe("TerminalManager", () => {
  let manager: TerminalManager;
  let mockStdoutWrite: any;
  let originalIsTTY: boolean | undefined;

  beforeEach(() => {
    manager = new TerminalManager();
    mockStdoutWrite = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    originalIsTTY = process.stdin.isTTY;
  });

  afterEach(() => {
    mockStdoutWrite.mockRestore();
    Object.defineProperty(process.stdin, "isTTY", {
      value: originalIsTTY,
      writable: true,
      configurable: true,
    });
  });

  describe("initialize", () => {
    it("should initialize terminal when in TTY mode", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        writable: true,
        configurable: true,
      });

      manager.initialize();

      expect(mockStdoutWrite).toHaveBeenCalledTimes(3);
      expect(mockStdoutWrite).toHaveBeenNthCalledWith(
        1,
        CONFIG.TERMINAL.CLEAR_SCREEN,
      );
      expect(mockStdoutWrite).toHaveBeenNthCalledWith(
        2,
        CONFIG.TERMINAL.HIDE_CURSOR,
      );
      expect(mockStdoutWrite).toHaveBeenNthCalledWith(
        3,
        CONFIG.TERMINAL.ENABLE_ALT_BUFFER,
      );
    });

    it("should not initialize when not in TTY mode", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: false,
        writable: true,
        configurable: true,
      });

      manager.initialize();

      expect(mockStdoutWrite).not.toHaveBeenCalled();
    });

    it("should not initialize when stdin.isTTY is undefined", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      manager.initialize();

      expect(mockStdoutWrite).not.toHaveBeenCalled();
    });

    it("should not initialize twice", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        writable: true,
        configurable: true,
      });

      manager.initialize();
      mockStdoutWrite.mockClear();
      manager.initialize();

      expect(mockStdoutWrite).not.toHaveBeenCalled();
    });

    it("should handle multiple managers independently", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        writable: true,
        configurable: true,
      });
      const manager2 = new TerminalManager();

      manager.initialize();
      manager2.initialize();

      expect(mockStdoutWrite).toHaveBeenCalledTimes(6); // 3 calls per manager
    });
  });

  describe("cleanup", () => {
    it("should cleanup terminal when initialized and in TTY mode", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        writable: true,
        configurable: true,
      });

      manager.initialize();
      mockStdoutWrite.mockClear();
      manager.cleanup();

      expect(mockStdoutWrite).toHaveBeenCalledTimes(2);
      expect(mockStdoutWrite).toHaveBeenNthCalledWith(
        1,
        CONFIG.TERMINAL.DISABLE_ALT_BUFFER,
      );
      expect(mockStdoutWrite).toHaveBeenNthCalledWith(
        2,
        CONFIG.TERMINAL.SHOW_CURSOR,
      );
    });

    it("should not cleanup when not initialized", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        writable: true,
        configurable: true,
      });

      manager.cleanup();

      expect(mockStdoutWrite).not.toHaveBeenCalled();
    });

    it("should not cleanup when not in TTY mode", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: false,
        writable: true,
        configurable: true,
      });

      manager.cleanup();

      expect(mockStdoutWrite).not.toHaveBeenCalled();
    });

    it("should not cleanup when stdin.isTTY is undefined", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      manager.cleanup();

      expect(mockStdoutWrite).not.toHaveBeenCalled();
    });

    it("should allow reinitialization after cleanup", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        writable: true,
        configurable: true,
      });

      manager.initialize();
      manager.cleanup();
      mockStdoutWrite.mockClear();
      manager.initialize();

      expect(mockStdoutWrite).toHaveBeenCalledTimes(3);
      expect(mockStdoutWrite).toHaveBeenNthCalledWith(
        1,
        CONFIG.TERMINAL.CLEAR_SCREEN,
      );
      expect(mockStdoutWrite).toHaveBeenNthCalledWith(
        2,
        CONFIG.TERMINAL.HIDE_CURSOR,
      );
      expect(mockStdoutWrite).toHaveBeenNthCalledWith(
        3,
        CONFIG.TERMINAL.ENABLE_ALT_BUFFER,
      );
    });

    it("should not cleanup twice", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        writable: true,
        configurable: true,
      });

      manager.initialize();
      manager.cleanup();
      mockStdoutWrite.mockClear();
      manager.cleanup();

      expect(mockStdoutWrite).not.toHaveBeenCalled();
    });
  });

  describe("isTTY", () => {
    it("should return true when process.stdin.isTTY is true", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        writable: true,
        configurable: true,
      });

      expect(manager.isTTY()).toBe(true);
    });

    it("should return false when process.stdin.isTTY is false", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: false,
        writable: true,
        configurable: true,
      });

      expect(manager.isTTY()).toBe(false);
    });

    it("should return false when process.stdin.isTTY is undefined", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(manager.isTTY()).toBe(false);
    });

    it("should return false when process.stdin.isTTY is null", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: null,
        writable: true,
        configurable: true,
      });

      expect(manager.isTTY()).toBe(false);
    });
  });

  describe("Integration tests", () => {
    it("should handle complete initialize-cleanup cycle", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        writable: true,
        configurable: true,
      });

      // Initialize
      manager.initialize();
      expect(mockStdoutWrite).toHaveBeenCalledTimes(3);

      // Cleanup
      manager.cleanup();
      expect(mockStdoutWrite).toHaveBeenCalledTimes(5);

      // Verify calls
      expect(mockStdoutWrite).toHaveBeenNthCalledWith(
        4,
        CONFIG.TERMINAL.DISABLE_ALT_BUFFER,
      );
      expect(mockStdoutWrite).toHaveBeenNthCalledWith(
        5,
        CONFIG.TERMINAL.SHOW_CURSOR,
      );
    });

    it("should handle multiple cycles", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        writable: true,
        configurable: true,
      });

      // First cycle
      manager.initialize();
      manager.cleanup();

      // Second cycle
      manager.initialize();
      manager.cleanup();

      expect(mockStdoutWrite).toHaveBeenCalledTimes(10); // 5 calls per cycle
    });

    it("should not interfere with TTY status check during operations", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        writable: true,
        configurable: true,
      });

      expect(manager.isTTY()).toBe(true);

      manager.initialize();
      expect(manager.isTTY()).toBe(true);

      manager.cleanup();
      expect(manager.isTTY()).toBe(true);

      // Change TTY status
      Object.defineProperty(process.stdin, "isTTY", {
        value: false,
        writable: true,
        configurable: true,
      });
      expect(manager.isTTY()).toBe(false);
    });

    it("should handle stdout write failures gracefully", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        writable: true,
        configurable: true,
      });
      mockStdoutWrite.mockImplementation(() => {
        throw new Error("Write failed");
      });

      // Should not throw
      expect(() => manager.initialize()).toThrow("Write failed");
    });

    it("should work with real terminal control codes", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        writable: true,
        configurable: true,
      });

      manager.initialize();

      // Verify actual ANSI codes are used
      expect(mockStdoutWrite).toHaveBeenCalledWith(
        expect.stringContaining("\x1b"),
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle rapid initialize/cleanup calls", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        writable: true,
        configurable: true,
      });

      for (let i = 0; i < 10; i++) {
        manager.initialize();
        manager.cleanup();
      }

      expect(mockStdoutWrite).toHaveBeenCalledTimes(50); // 5 calls per cycle × 10 cycles
    });

    it("should maintain state correctly across operations", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        writable: true,
        configurable: true,
      });

      // Initialize
      manager.initialize();
      expect(mockStdoutWrite).toHaveBeenCalledTimes(3);

      // Try to initialize again (should be ignored)
      mockStdoutWrite.mockClear();
      manager.initialize();
      expect(mockStdoutWrite).not.toHaveBeenCalled();

      // Cleanup
      manager.cleanup();
      expect(mockStdoutWrite).toHaveBeenCalledTimes(2);

      // Try to cleanup again (should be ignored)
      mockStdoutWrite.mockClear();
      manager.cleanup();
      expect(mockStdoutWrite).not.toHaveBeenCalled();
    });
  });
});
