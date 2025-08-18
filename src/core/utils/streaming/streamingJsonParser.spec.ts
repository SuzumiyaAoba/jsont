/**
 * Tests for StreamingJsonParser
 */

import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  JsonObjectTransform,
  type ParseProgress,
  parseJsonStream,
  StreamingJsonParser,
  type StreamingParseOptions,
} from "./streamingJsonParser";

describe("StreamingJsonParser", () => {
  let parser: StreamingJsonParser;

  beforeEach(() => {
    parser = new StreamingJsonParser();
  });

  describe("Basic Functionality", () => {
    it("should parse simple JSON object", () => {
      const input = '{"name": "test", "value": 42}';
      const result = parser.parseString(input);

      expect(result.completed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.totalObjects).toBe(1);
    });

    it("should parse JSON array", () => {
      const input = '[1, 2, 3, "test"]';
      const result = parser.parseString(input);

      expect(result.completed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse nested JSON structures", () => {
      const input =
        '{"users": [{"id": 1, "name": "John"}, {"id": 2, "name": "Jane"}]}';
      const result = parser.parseString(input);

      expect(result.completed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.maxDepth).toBeGreaterThan(1);
    });

    it("should handle primitive values", () => {
      const inputs = ["42", "true", "false", "null", '"string"'];

      inputs.forEach((input) => {
        const result = parser.parseString(input);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe("Large Data Handling", () => {
    it("should handle large JSON objects efficiently", () => {
      // Create large JSON object
      const largeObj = {
        users: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          profile: {
            age: 20 + (i % 50),
            preferences: {
              theme: i % 2 === 0 ? "dark" : "light",
              notifications: i % 3 === 0,
            },
          },
        })),
      };

      const input = JSON.stringify(largeObj);
      const startTime = performance.now();

      const result = parser.parseString(input);

      const parseTime = performance.now() - startTime;

      expect(result.completed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.totalObjects).toBe(1);
      expect(parseTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should respect maxObjects limit", () => {
      const options: StreamingParseOptions = { maxObjects: 2 };
      const limitedParser = new StreamingJsonParser(options);

      const input = '{"a": 1} {"b": 2} {"c": 3}'; // Multiple objects
      const result = limitedParser.parseString(input);

      expect(result.stats.totalObjects).toBeLessThanOrEqual(2);
    });

    it("should respect maxBufferSize limit", () => {
      const options: StreamingParseOptions = { maxBufferSize: 1024 }; // 1KB limit
      const limitedParser = new StreamingJsonParser(options);

      // Create data larger than buffer
      const largeInput = JSON.stringify({
        data: "x".repeat(2048), // 2KB string
      });

      const result = limitedParser.parseString(largeInput);
      expect(result.errors).toHaveLength(0); // Should handle gracefully
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON gracefully", () => {
      const malformedInputs = [
        '{"unclosed": ',
        "[1, 2, 3",
        '{"invalid": "quote}',
        "{trailing: comma,}",
        "undefined",
      ];

      malformedInputs.forEach((input) => {
        const result = parser.parseString(input);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it("should provide error location information", () => {
      const input = '{"valid": true, "invalid": }';
      const result = parser.parseString(input);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("line");
      expect(result.errors[0]).toContain("column");
    });

    it("should handle unexpected characters", () => {
      const input = '{"test": @invalid}';
      const result = parser.parseString(input);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Unexpected character");
    });
  });

  describe("Streaming Operations", () => {
    it("should parse from readable stream", async () => {
      const data = '{"stream": "test", "data": [1, 2, 3]}';
      const stream = Readable.from([data]);

      const result = await parser.parseStream(stream);

      expect(result.completed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle chunked stream data", async () => {
      const data = '{"chunked": "data", "numbers": [1, 2, 3, 4, 5]}';
      const chunks = [data.slice(0, 10), data.slice(10, 25), data.slice(25)];

      const stream = Readable.from(chunks);
      const result = await parser.parseStream(stream);

      expect(result.completed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should emit progress events", async () => {
      const progressEvents: ParseProgress[] = [];
      const progressParser = new StreamingJsonParser({ enableProgress: true });

      progressParser.on("progress", (progress: ParseProgress) => {
        progressEvents.push(progress);
      });

      const data = JSON.stringify({
        test: "progress",
        array: Array(100).fill(0),
      });
      const stream = Readable.from([data]);

      await progressParser.parseStream(stream, data.length);

      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[progressEvents.length - 1]?.percentage).toBe(100);
    });

    it("should emit object events during parsing", async () => {
      const objects: any[] = [];
      parser.on("object", (obj) => {
        objects.push(obj);
      });

      const data = '{"first": "object"} {"second": "object"}';
      const stream = Readable.from([data]);

      await parser.parseStream(stream);

      expect(objects).toHaveLength(2);
      expect(objects[0]).toEqual({ first: "object" });
      expect(objects[1]).toEqual({ second: "object" });
    });
  });

  describe("Performance Tracking", () => {
    it("should track parsing statistics", () => {
      const input = JSON.stringify({
        nested: {
          deep: {
            structure: {
              with: ["arrays", "and", "objects"],
            },
          },
        },
      });

      const result = parser.parseString(input);

      expect(result.stats.totalBytes).toBeGreaterThan(0);
      expect(result.stats.parseTime).toBeGreaterThan(0);
      expect(result.stats.maxDepth).toBeGreaterThan(1);
      expect(result.stats.peakMemoryUsage).toBeGreaterThan(0);
    });

    it("should handle deeply nested structures", () => {
      // Create deeply nested object
      let nested: any = { value: "deep" };
      for (let i = 0; i < 50; i++) {
        nested = { [`level${i}`]: nested };
      }

      const input = JSON.stringify(nested);
      const result = parser.parseString(input);

      expect(result.completed).toBe(true);
      expect(result.stats.maxDepth).toBeGreaterThan(40);
    });
  });

  describe("Special Data Types", () => {
    it("should handle escape sequences in strings", () => {
      const input = '{"escaped": "\\n\\t\\r\\"\\\\\/"}';
      const result = parser.parseString(input);

      expect(result.completed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle unicode characters", () => {
      const input = '{"unicode": "\\u0048\\u0065\\u006C\\u006C\\u006F"}'; // "Hello"
      const result = parser.parseString(input);

      expect(result.completed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle various number formats", () => {
      const input =
        '{"int": 42, "float": 3.14, "exp": 1.23e-4, "negative": -123}';
      const result = parser.parseString(input);

      expect(result.completed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle empty objects and arrays", () => {
      const input = '{"empty_obj": {}, "empty_arr": [], "null_val": null}';
      const result = parser.parseString(input);

      expect(result.completed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Memory Management", () => {
    it("should clean up buffer during processing", () => {
      const options: StreamingParseOptions = { chunkSize: 1024 };
      const memoryParser = new StreamingJsonParser(options);

      // Create large input that requires buffer cleanup
      const largeInput = JSON.stringify({
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          data: "x".repeat(100),
        })),
      });

      const result = memoryParser.parseString(largeInput);

      expect(result.completed).toBe(true);
      expect(result.stats.peakMemoryUsage).toBeDefined();
    });

    it("should handle memory pressure gracefully", () => {
      // Mock memory pressure scenario
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = vi.fn(() => ({
        rss: 1024 * 1024 * 1024, // 1GB
        heapTotal: 512 * 1024 * 1024, // 512MB
        heapUsed: 400 * 1024 * 1024, // 400MB
        external: 0,
        arrayBuffers: 0,
      })) as any;

      try {
        const input = JSON.stringify({ test: "memory pressure" });
        const result = parser.parseString(input);

        expect(result.completed).toBe(true);
        expect(result.stats.peakMemoryUsage).toBeGreaterThan(0);
      } finally {
        process.memoryUsage = originalMemoryUsage;
      }
    });
  });
});

describe("Convenience Functions", () => {
  it("should parseJsonStream work correctly", async () => {
    const data = '{"convenience": "function"}';
    const stream = Readable.from([data]);

    const result = await parseJsonStream(stream);

    expect(result.completed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should handle parse options in convenience functions", async () => {
    const data = JSON.stringify({ test: Array(100).fill("data") });
    const stream = Readable.from([data]);

    const options: StreamingParseOptions = {
      maxObjects: 1,
      enableProgress: false,
    };

    const result = await parseJsonStream(stream, options);

    expect(result.completed).toBe(true);
    expect(result.stats.totalObjects).toBe(1);
  });
});

describe("JsonObjectTransform", () => {
  it("should transform stream objects", async () => {
    const transform = new JsonObjectTransform();
    const objects: any[] = [];

    transform.on("data", (obj) => {
      objects.push(obj);
    });

    const promise = new Promise<void>((resolve) => {
      transform.on("end", () => {
        expect(objects).toHaveLength(1);
        expect(objects[0]).toEqual({ transform: "test" });
        resolve();
      });
    });

    const data = JSON.stringify({ transform: "test" });
    const stream = Readable.from([data]);

    stream.pipe(transform);
    await promise;
  });

  it("should handle multiple objects in transform", async () => {
    const transform = new JsonObjectTransform();
    const objects: any[] = [];

    transform.on("data", (obj) => {
      objects.push(obj);
    });

    const promise = new Promise<void>((resolve) => {
      transform.on("end", () => {
        expect(objects.length).toBeGreaterThan(0);
        resolve();
      });
    });

    const data = '{"first": 1} {"second": 2}';
    const chunks = [data.slice(0, 10), data.slice(10)];
    const stream = Readable.from(chunks);

    stream.pipe(transform);
    await promise;
  });

  it("should handle transform errors gracefully", async () => {
    const transform = new JsonObjectTransform();
    let errorEmitted = false;

    const promise = new Promise<void>((resolve, reject) => {
      transform.on("error", () => {
        errorEmitted = true;
        resolve();
      });

      transform.on("end", () => {
        if (!errorEmitted) {
          reject(new Error("Expected error was not emitted"));
        }
      });
    });

    // Send malformed JSON
    const stream = Readable.from(['{"malformed":']);
    stream.pipe(transform);

    await promise;
  });
});

describe("Edge Cases", () => {
  it("should handle empty input", () => {
    const parser = new StreamingJsonParser();
    const result = parser.parseString("");

    expect(result.completed).toBe(false);
    expect(result.stats.totalObjects).toBe(0);
  });

  it("should handle whitespace-only input", () => {
    const parser = new StreamingJsonParser();
    const result = parser.parseString("   \n\t  ");

    expect(result.completed).toBe(false);
    expect(result.stats.totalObjects).toBe(0);
  });

  it("should handle single character input", () => {
    const parser = new StreamingJsonParser();
    const result = parser.parseString("{");

    expect(result.completed).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should handle extremely large numbers", () => {
    const parser = new StreamingJsonParser();
    const input = '{"large": 1.7976931348623157e+308}'; // Near Number.MAX_VALUE
    const result = parser.parseString(input);

    expect(result.completed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should handle very long strings", () => {
    const parser = new StreamingJsonParser();
    const longString = "x".repeat(10000);
    const input = JSON.stringify({ long: longString });
    const result = parser.parseString(input);

    expect(result.completed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
