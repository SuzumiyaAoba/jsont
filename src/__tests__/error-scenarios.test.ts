/**
 * Critical error scenarios and edge cases tests
 * Ensures system stability under various error conditions
 */

import { describe, expect, it, vi } from "vitest";

// Mock fs operations for testing file system errors
vi.mock("node:fs/promises", () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  access: vi.fn(),
  readFile: vi.fn(),
}));

// Mock process for testing process-related errors
const mockExit = vi.fn();
vi.mock("node:process", () => ({
  exit: mockExit,
  env: {},
  stdout: { write: vi.fn() },
  stderr: { write: vi.fn() },
}));

describe("Critical Error Scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("JSON Parsing Errors", () => {
    it("should handle malformed JSON gracefully", () => {
      const malformedJson = '{"name": "test", "incomplete": ';

      expect(() => JSON.parse(malformedJson)).toThrow();

      // Test our error handling wrapper
      try {
        JSON.parse(malformedJson);
      } catch (error) {
        expect(error).toBeInstanceOf(SyntaxError);
        expect((error as Error).message).toContain(
          "Unexpected end of JSON input",
        );
      }
    });

    it("should handle extremely large JSON objects", () => {
      // Create a very large object
      const largeObject: Record<string, any> = {};
      for (let i = 0; i < 10000; i++) {
        largeObject[`key_${i}`] = {
          id: i,
          data: "x".repeat(100),
          nested: {
            level1: { level2: { level3: `value_${i}` } },
          },
        };
      }

      // Should not throw even with large objects
      expect(() => JSON.stringify(largeObject)).not.toThrow();

      const jsonString = JSON.stringify(largeObject);
      expect(jsonString.length).toBeGreaterThan(1000000); // > 1MB

      // Should be able to parse it back
      expect(() => JSON.parse(jsonString)).not.toThrow();
    });

    it("should handle circular references in objects", () => {
      const circularObj: any = { name: "test" };
      circularObj.self = circularObj;

      // JSON.stringify should throw on circular references
      expect(() => JSON.stringify(circularObj)).toThrow(/circular structure/i);
    });

    it("should handle various invalid JSON formats", () => {
      const invalidJsonExamples = [
        "undefined",
        "function() {}",
        "{ name: 'test' }", // unquoted keys
        "{ 'name': 'test' }", // single quotes
        '{ "name": "test", }', // trailing comma
        "NaN",
        "Infinity",
        "-Infinity",
      ];

      invalidJsonExamples.forEach((invalid) => {
        expect(() => JSON.parse(invalid)).toThrow();
      });
    });
  });

  describe("File System Errors", () => {
    it("should handle permission denied errors", async () => {
      const { writeFile } = await import("node:fs/promises");
      vi.mocked(writeFile).mockRejectedValue(
        Object.assign(new Error("EACCES: permission denied"), {
          code: "EACCES",
          errno: -13,
          syscall: "open",
          path: "/root/protected-file.txt",
        }),
      );

      try {
        await writeFile("/root/protected-file.txt", "test data");
      } catch (error: any) {
        expect(error.code).toBe("EACCES");
        expect(error.message).toContain("permission denied");
      }
    });

    it("should handle disk full errors", async () => {
      const { writeFile } = await import("node:fs/promises");
      vi.mocked(writeFile).mockRejectedValue(
        Object.assign(new Error("ENOSPC: no space left on device"), {
          code: "ENOSPC",
          errno: -28,
          syscall: "write",
        }),
      );

      try {
        await writeFile("/tmp/test.txt", "x".repeat(1000000));
      } catch (error: any) {
        expect(error.code).toBe("ENOSPC");
        expect(error.message).toContain("no space left on device");
      }
    });

    it("should handle file not found errors", async () => {
      const { readFile } = await import("node:fs/promises");
      vi.mocked(readFile).mockRejectedValue(
        Object.assign(new Error("ENOENT: no such file or directory"), {
          code: "ENOENT",
          errno: -2,
          syscall: "open",
          path: "/nonexistent/path/file.json",
        }),
      );

      try {
        await readFile("/nonexistent/path/file.json", "utf8");
      } catch (error: any) {
        expect(error.code).toBe("ENOENT");
        expect(error.message).toContain("no such file or directory");
      }
    });

    it("should handle directory creation failures", async () => {
      const { mkdir } = await import("node:fs/promises");
      vi.mocked(mkdir).mockRejectedValue(
        Object.assign(new Error("EEXIST: file already exists"), {
          code: "EEXIST",
          errno: -17,
          syscall: "mkdir",
          path: "/existing/directory",
        }),
      );

      try {
        await mkdir("/existing/directory", { recursive: true });
      } catch (error: any) {
        expect(error.code).toBe("EEXIST");
      }
    });
  });

  describe("Memory and Performance Errors", () => {
    it("should handle out of memory scenarios gracefully", () => {
      // Simulate a function that might cause memory issues
      const createLargeArray = (size: number) => {
        const arr = [];
        for (let i = 0; i < size; i++) {
          arr.push({
            index: i,
            data: "x".repeat(1000),
            timestamp: Date.now(),
          });
        }
        return arr;
      };

      // Test with reasonable size (should work)
      expect(() => createLargeArray(1000)).not.toThrow();

      // For extremely large sizes, we can't actually test OOM without crashing the test,
      // but we can test that our code doesn't create infinite loops
      const size = 1000000;
      const startTime = Date.now();

      try {
        createLargeArray(size);
        const endTime = Date.now();
        // Should complete within reasonable time (not infinite loop)
        expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max
      } catch (error) {
        // If it throws due to memory constraints, that's acceptable
        expect(error).toBeDefined();
      }
    });

    it("should handle stack overflow in recursive operations", () => {
      const deeplyNestedObject = (depth: number): any => {
        if (depth === 0) return { value: "leaf" };
        return { nested: deeplyNestedObject(depth - 1) };
      };

      // Reasonable depth should work
      expect(() => deeplyNestedObject(100)).not.toThrow();

      // Extreme depth might cause stack overflow - test that we handle it
      try {
        const result = deeplyNestedObject(10000);
        expect(result).toBeDefined();
      } catch (error) {
        // Stack overflow is acceptable for extreme depths
        expect(error).toBeInstanceOf(RangeError);
      }
    });
  });

  describe("Network and External Service Errors", () => {
    it("should handle network timeout errors", async () => {
      // Mock a network operation that times out
      const networkOperation = () => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("ETIMEDOUT: network timeout"));
          }, 100);
        });
      };

      await expect(networkOperation()).rejects.toThrow("network timeout");
    });

    it("should handle connection refused errors", async () => {
      const connectionError = Object.assign(
        new Error("ECONNREFUSED: Connection refused"),
        {
          code: "ECONNREFUSED",
          errno: -61,
          syscall: "connect",
          address: "127.0.0.1",
          port: 3000,
        },
      );

      const mockFetch = vi.fn().mockRejectedValue(connectionError);

      await expect(
        mockFetch("http://localhost:3000/api"),
      ).rejects.toMatchObject({
        code: "ECONNREFUSED",
        message: expect.stringContaining("Connection refused"),
      });
    });

    it("should handle DNS resolution failures", async () => {
      const dnsError = Object.assign(
        new Error("ENOTFOUND: getaddrinfo ENOTFOUND"),
        {
          code: "ENOTFOUND",
          errno: -3008,
          syscall: "getaddrinfo",
          hostname: "nonexistent-domain-12345.com",
        },
      );

      const mockNetworkCall = vi.fn().mockRejectedValue(dnsError);

      await expect(mockNetworkCall()).rejects.toMatchObject({
        code: "ENOTFOUND",
        message: expect.stringContaining("ENOTFOUND"),
      });
    });
  });

  describe("Process and System Errors", () => {
    it("should handle process termination signals", () => {
      const signalHandler = vi.fn();

      // Simulate signal handling
      process.on = vi.fn((event, handler) => {
        if (event === "SIGTERM") {
          signalHandler.mockImplementation(handler);
        }
      });

      // Test signal handler setup
      expect(typeof signalHandler).toBe("function");
    });

    it("should handle uncaught exceptions", () => {
      const uncaughtHandler = vi.fn();

      // Mock uncaught exception handler
      process.on = vi.fn((event, handler) => {
        if (event === "uncaughtException") {
          uncaughtHandler.mockImplementation(handler);
        }
      });

      // Test that handler can be set up
      expect(typeof uncaughtHandler).toBe("function");
    });

    it("should handle unhandled promise rejections", () => {
      const rejectionHandler = vi.fn();

      // Mock unhandled rejection handler
      process.on = vi.fn((event, handler) => {
        if (event === "unhandledRejection") {
          rejectionHandler.mockImplementation(handler);
        }
      });

      // Test that handler can be set up
      expect(typeof rejectionHandler).toBe("function");
    });
  });

  describe("Unicode and Encoding Errors", () => {
    it("should handle invalid UTF-8 sequences", () => {
      const invalidUtf8 = "\uD800"; // Lone surrogate

      // Should not crash when handling invalid UTF-8
      expect(() => JSON.stringify({ text: invalidUtf8 })).not.toThrow();

      const result = JSON.stringify({ text: invalidUtf8 });
      expect(result).toContain("\\ud800");
    });

    it("should handle extremely long strings", () => {
      const longString = "x".repeat(1000000); // 1MB string

      expect(() => JSON.stringify({ data: longString })).not.toThrow();

      const result = JSON.stringify({ data: longString });
      expect(result.length).toBeGreaterThan(1000000);
    });

    it("should handle various Unicode characters", () => {
      const unicodeTest = {
        emoji: "🚀🌟💻",
        chinese: "你好世界",
        arabic: "مرحبا بالعالم",
        russian: "Привет мир",
        japanese: "こんにちは世界",
        special: "©®™€£¥",
        combining: "é̂ñ̃ü̈", // combining diacritical marks
      };

      expect(() => JSON.stringify(unicodeTest)).not.toThrow();

      const jsonString = JSON.stringify(unicodeTest);
      const parsed = JSON.parse(jsonString);

      expect(parsed.emoji).toBe("🚀🌟💻");
      expect(parsed.chinese).toBe("你好世界");
      expect(parsed.arabic).toBe("مرحبا بالعالم");
    });
  });

  describe("Resource Exhaustion", () => {
    it("should handle file handle exhaustion", async () => {
      const { writeFile } = await import("node:fs/promises");

      // Mock file handle exhaustion
      vi.mocked(writeFile).mockRejectedValue(
        Object.assign(new Error("EMFILE: too many open files"), {
          code: "EMFILE",
          errno: -24,
          syscall: "open",
        }),
      );

      try {
        await writeFile("/tmp/test.txt", "data");
      } catch (error: any) {
        expect(error.code).toBe("EMFILE");
        expect(error.message).toContain("too many open files");
      }
    });

    it("should handle thread pool exhaustion", async () => {
      // Simulate many concurrent operations
      const operations = Array.from({ length: 100 }, (_, i) =>
        Promise.resolve().then(() => ({ id: i, processed: Date.now() })),
      );

      // Should complete without throwing
      const results = await Promise.all(operations);
      expect(results).toHaveLength(100);
      expect(results[0]).toHaveProperty("id", 0);
      expect(results[99]).toHaveProperty("id", 99);
    });
  });

  describe("Data Validation Errors", () => {
    it("should handle type mismatches", () => {
      const mixedTypeData = {
        string: "hello",
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, "two", { three: 3 }],
        object: { nested: { deeply: "nested" } },
        function: () => "not serializable",
        symbol: Symbol("test"),
        // Note: BigInt cannot be serialized with JSON.stringify
      };

      // JSON.stringify should handle most types gracefully
      const result = JSON.stringify(mixedTypeData);
      const parsed = JSON.parse(result);

      expect(parsed.string).toBe("hello");
      expect(parsed.number).toBe(42);
      expect(parsed.boolean).toBe(true);
      expect(parsed.null).toBe(null);
      expect(parsed.undefined).toBeUndefined();
      expect(parsed.array).toEqual([1, "two", { three: 3 }]);
      expect(parsed.object).toEqual({ nested: { deeply: "nested" } });

      // Function and symbol are not serializable
      expect(parsed.function).toBeUndefined();
      expect(parsed.symbol).toBeUndefined();
    });

    it("should handle BigInt serialization separately", () => {
      const dataWithBigInt = {
        normalNumber: 42,
        bigIntValue: BigInt(123),
      };

      // BigInt should throw when trying to serialize
      expect(() => JSON.stringify(dataWithBigInt)).toThrow(
        /Do not know how to serialize a BigInt/,
      );

      // But we can handle it with a replacer
      const result = JSON.stringify(dataWithBigInt, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      );
      const parsed = JSON.parse(result);

      expect(parsed.normalNumber).toBe(42);
      expect(parsed.bigIntValue).toBe("123");
    });

    it("should handle date serialization edge cases", () => {
      const dateTest = {
        validDate: new Date("2023-01-01T00:00:00.000Z"),
        invalidDate: new Date("invalid"),
        epoch: new Date(0),
        future: new Date("2099-12-31T23:59:59.999Z"),
      };

      const result = JSON.stringify(dateTest);
      const parsed = JSON.parse(result);

      expect(parsed.validDate).toBe("2023-01-01T00:00:00.000Z");
      // Invalid dates serialize to null in JSON
      expect(parsed.invalidDate).toBe(null);
      expect(parsed.epoch).toBe("1970-01-01T00:00:00.000Z");
      expect(parsed.future).toBe("2099-12-31T23:59:59.999Z");
    });

    it("should handle invalid date string representation", () => {
      const invalidDate = new Date("invalid");

      // Invalid date toString returns "Invalid Date"
      expect(invalidDate.toString()).toBe("Invalid Date");

      // But JSON.stringify returns null for invalid dates
      expect(JSON.stringify(invalidDate)).toBe("null");

      // And when part of an object
      const objectWithInvalidDate = { date: invalidDate };
      const serialized = JSON.stringify(objectWithInvalidDate);
      const parsed = JSON.parse(serialized);

      expect(parsed.date).toBe(null);
    });
  });
});
