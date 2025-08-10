/**
 * Tests for DebugLogger utility
 */

import { DEBUG_PREFIX } from "@core/config/constants";
import { DebugLogger } from "./debug";

describe("DebugLogger", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    delete process.env["DEBUG"];
  });

  describe("Constructor", () => {
    it("should enable debug mode when DEBUG environment variable is set", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();

      logger.log("test message");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${DEBUG_PREFIX} test message`,
      );
    });

    it("should disable debug mode when DEBUG environment variable is not set", () => {
      delete process.env["DEBUG"];
      const logger = new DebugLogger();

      logger.log("test message");

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should disable debug mode when DEBUG environment variable is empty", () => {
      process.env["DEBUG"] = "";
      const logger = new DebugLogger();

      logger.log("test message");

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should enable debug mode with any truthy DEBUG value", () => {
      process.env["DEBUG"] = "true";
      const logger = new DebugLogger();

      logger.log("test message");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${DEBUG_PREFIX} test message`,
      );
    });
  });

  describe("logReadStats", () => {
    it("should log successful read result when debug is enabled", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();

      logger.logReadStats({
        success: true,
        canUseKeyboard: true,
        data: { test: "data" },
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${DEBUG_PREFIX} Read result: success, keyboard: true`,
      );
    });

    it("should not log when debug is disabled", () => {
      delete process.env["DEBUG"];
      const logger = new DebugLogger();

      logger.logReadStats({
        success: true,
        canUseKeyboard: true,
        data: { test: "data" },
      });

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should not log failed read result", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();

      logger.logReadStats({
        success: false,
        canUseKeyboard: false,
        data: null,
        error: new Error("Test error"),
      });

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should log with correct keyboard status", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();

      logger.logReadStats({
        success: true,
        canUseKeyboard: false,
        data: { test: "data" },
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${DEBUG_PREFIX} Read result: success, keyboard: false`,
      );
    });
  });

  describe("logJsonData", () => {
    it("should log small JSON data when debug is enabled", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();
      const testData = { name: "test", value: 42 };

      logger.logJsonData(testData);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${DEBUG_PREFIX} JSON data:`,
        JSON.stringify(testData, null, 2),
      );
    });

    it("should not log when debug is disabled", () => {
      delete process.env["DEBUG"];
      const logger = new DebugLogger();

      logger.logJsonData({ test: "data" });

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should log character count for large JSON data", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();

      // Create large JSON data (> 1KB)
      const largeData = {
        largeArray: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `item-${i}`,
          description: `This is a very long description for item ${i} that contains a lot of text to make the JSON large enough to trigger the size check`,
        })),
      };

      logger.logJsonData(largeData);

      const expectedLength = JSON.stringify(largeData, null, 2).length;
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${DEBUG_PREFIX} JSON data: [${expectedLength} characters]`,
      );
    });

    it("should handle JSON stringify errors", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();

      // Create circular reference to cause stringify error
      const circularData: any = { name: "test" };
      circularData.self = circularData;

      logger.logJsonData(circularData);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${DEBUG_PREFIX} Failed to stringify JSON data:`,
        expect.any(Error),
      );
    });

    it("should log null data", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();

      logger.logJsonData(null);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${DEBUG_PREFIX} JSON data:`,
        "null",
      );
    });

    it("should log array data", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();
      const arrayData = [1, 2, 3, "test"];

      logger.logJsonData(arrayData);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${DEBUG_PREFIX} JSON data:`,
        JSON.stringify(arrayData, null, 2),
      );
    });

    it("should log string data", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();

      logger.logJsonData("simple string");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${DEBUG_PREFIX} JSON data:`,
        '"simple string"',
      );
    });

    it("should log number data", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();

      logger.logJsonData(42);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${DEBUG_PREFIX} JSON data:`,
        "42",
      );
    });

    it("should log boolean data", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();

      logger.logJsonData(true);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${DEBUG_PREFIX} JSON data:`,
        "true",
      );
    });
  });

  describe("log", () => {
    it("should log message with arguments when debug is enabled", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();

      logger.log("Test message", { key: "value" }, 42, true);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${DEBUG_PREFIX} Test message`,
        { key: "value" },
        42,
        true,
      );
    });

    it("should not log when debug is disabled", () => {
      delete process.env["DEBUG"];
      const logger = new DebugLogger();

      logger.log("Test message", "arg1", "arg2");

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should log message without arguments", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();

      logger.log("Simple message");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${DEBUG_PREFIX} Simple message`,
      );
    });

    it("should log empty message", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();

      logger.log("");

      expect(consoleErrorSpy).toHaveBeenCalledWith(`${DEBUG_PREFIX} `);
    });

    it("should handle undefined and null arguments", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();

      logger.log("Message with null/undefined", null, undefined);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${DEBUG_PREFIX} Message with null/undefined`,
        null,
        undefined,
      );
    });

    it("should handle complex object arguments", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();
      const complexObj = {
        nested: { deep: { value: "test" } },
        array: [1, 2, { item: "value" }],
        func: () => "test",
      };

      logger.log("Complex object", complexObj);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${DEBUG_PREFIX} Complex object`,
        complexObj,
      );
    });
  });

  describe("Integration tests", () => {
    it("should work correctly with multiple method calls", () => {
      process.env["DEBUG"] = "1";
      const logger = new DebugLogger();

      logger.log("Starting test");
      logger.logJsonData({ test: "data" });
      logger.logReadStats({
        success: true,
        canUseKeyboard: true,
        data: { test: "data" },
      });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
    });

    it("should not interfere when debug is disabled", () => {
      delete process.env["DEBUG"];
      const logger = new DebugLogger();

      logger.log("Starting test");
      logger.logJsonData({ test: "data" });
      logger.logReadStats({
        success: true,
        canUseKeyboard: true,
        data: { test: "data" },
      });

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
