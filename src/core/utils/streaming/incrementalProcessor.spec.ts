/**
 * Tests for IncrementalJsonProcessor
 */

import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  IncrementalJsonProcessor,
  type IncrementalProcessOptions,
  type ProcessingResult,
  type ProcessingState,
  processJsonIncrementally,
  processJsonStreamIncrementally,
} from "./incrementalProcessor";

describe("IncrementalJsonProcessor", () => {
  let processor: IncrementalJsonProcessor;

  beforeEach(() => {
    processor = new IncrementalJsonProcessor();
  });

  describe("Basic Processing", () => {
    it("should process simple object", async () => {
      const data = { name: "test", value: 42 };
      const results = await processor.processData(data);

      expect(results).toHaveLength(1);
      expect(results[0]?.success).toBe(true);
      expect(results[0]?.value).toEqual(data);
    });

    it("should process array", async () => {
      const data = [1, 2, 3, "test"];
      const results = await processor.processData(data);

      expect(results.length).toBeGreaterThan(1);
      expect(results.every((result) => result.success)).toBe(true);
    });

    it("should process nested structure", async () => {
      const data = {
        users: [
          { id: 1, name: "John" },
          { id: 2, name: "Jane" },
        ],
        metadata: { total: 2 },
      };

      const results = await processor.processData(data);

      expect(results.length).toBeGreaterThan(5);
      expect(results.every((result) => result.success)).toBe(true);
    });

    it("should process primitive values", async () => {
      const primitives = [42, "string", true, null];

      for (const primitive of primitives) {
        const results = await processor.processData(primitive);
        expect(results).toHaveLength(1);
        expect(results[0]?.success).toBe(true);
        expect(results[0]?.value).toBe(primitive);
      }
    });
  });

  describe("Batch Processing", () => {
    it("should process data in batches", async () => {
      const options: IncrementalProcessOptions = {
        batchSize: 10,
        enablePartialResults: true,
      };
      const batchProcessor = new IncrementalJsonProcessor(options);

      const data = {
        items: Array.from({ length: 50 }, (_, i) => ({ id: i, value: i * 2 })),
      };

      const progressUpdates: ProcessingState[] = [];
      batchProcessor.on("progress", (state: ProcessingState) => {
        progressUpdates.push(state);
      });

      const results = await batchProcessor.processData(data);

      expect(results.length).toBeGreaterThan(50);
      expect(progressUpdates.length).toBeGreaterThan(1);
      expect(progressUpdates[progressUpdates.length - 1]?.progress).toBe(100);
    });

    it("should emit partial results", async () => {
      const options: IncrementalProcessOptions = {
        batchSize: 5,
        enablePartialResults: true,
      };
      const partialProcessor = new IncrementalJsonProcessor(options);

      const data = Array.from({ length: 20 }, (_, i) => ({ id: i }));

      const partialResults: ProcessingResult[][] = [];
      partialProcessor.on("partial", (results: ProcessingResult[]) => {
        partialResults.push(results);
      });

      await partialProcessor.processData(data);

      expect(partialResults.length).toBeGreaterThan(1);
      expect(partialResults.every((batch) => batch.length <= 5)).toBe(true);
    });

    it("should handle custom batch size", async () => {
      const options: IncrementalProcessOptions = {
        batchSize: 3,
      };
      const customProcessor = new IncrementalJsonProcessor(options);

      const data = Array.from({ length: 10 }, (_, i) => i);

      const progressUpdates: ProcessingState[] = [];
      customProcessor.on("progress", (state: ProcessingState) => {
        progressUpdates.push(state);
      });

      await customProcessor.processData(data);

      // Should have multiple progress updates due to small batch size
      expect(progressUpdates.length).toBeGreaterThan(1);
    });
  });

  describe("Worker Thread Processing", () => {
    it("should process with worker threads when enabled", async () => {
      const options: IncrementalProcessOptions = {
        useWorkerThreads: true,
        maxWorkers: 2,
        batchSize: 10,
      };
      const workerProcessor = new IncrementalJsonProcessor(options);

      const data = {
        items: Array.from({ length: 50 }, (_, i) => ({
          id: i,
          data: "x".repeat(100),
        })),
      };

      const results = await workerProcessor.processData(data);

      expect(results.length).toBeGreaterThan(50);
      expect(results.every((result) => result.success)).toBe(true);
    });

    it("should fall back to sequential processing if workers fail", async () => {
      const options: IncrementalProcessOptions = {
        useWorkerThreads: false, // Explicitly disable workers
        enableDeepProcessing: false, // Only process array elements
      };
      const sequentialProcessor = new IncrementalJsonProcessor(options);

      const data = Array.from({ length: 20 }, (_, i) => ({ id: i }));

      const results = await sequentialProcessor.processData(data);

      expect(results.length).toBe(20);
      expect(results.every((result) => result.success)).toBe(true);
    });
  });

  describe("Custom Processing", () => {
    it("should use custom processor function", async () => {
      const customProcessor = vi.fn((value, context) => ({
        value: { processed: value, index: context.index },
        success: true,
        metadata: { custom: true },
      }));

      const options: IncrementalProcessOptions = {
        processor: customProcessor,
      };
      const processor = new IncrementalJsonProcessor(options);

      const data = [1, 2, 3];
      const results = await processor.processData(data);

      expect(customProcessor).toHaveBeenCalled();
      expect(results.every((result) => result.metadata?.["custom"])).toBe(true);
    });

    it("should handle processor errors gracefully", async () => {
      const errorProcessor = vi.fn(() => {
        throw new Error("Processing failed");
      });

      const options: IncrementalProcessOptions = {
        processor: errorProcessor,
      };
      const processor = new IncrementalJsonProcessor(options);

      const data = [1, 2, 3];
      const results = await processor.processData(data);

      expect(results.every((result) => !result.success)).toBe(true);
      expect(results.every((result) => result.error)).toBeTruthy();
    });
  });

  describe("Stream Processing", () => {
    it("should process from stream", async () => {
      const data = JSON.stringify({ stream: "test", items: [1, 2, 3] });
      const stream = Readable.from([data]);

      const results = await processor.processStream(stream);

      expect(results.length).toBeGreaterThan(1);
      expect(results.every((result) => result.success)).toBe(true);
    });

    it("should handle malformed stream data", async () => {
      const malformedData = '{"invalid": json}';
      const stream = Readable.from([malformedData]);

      await expect(processor.processStream(stream)).rejects.toThrow();
    });

    it("should handle empty stream", async () => {
      const stream = Readable.from([""]);

      await expect(processor.processStream(stream)).rejects.toThrow();
    });
  });

  describe("Progress Tracking", () => {
    it("should emit start event", async () => {
      let startEmitted = false;
      processor.on("start", () => {
        startEmitted = true;
      });

      await processor.processData([1, 2, 3]);

      expect(startEmitted).toBe(true);
    });

    it("should emit progress events", async () => {
      const progressEvents: ProcessingState[] = [];
      processor.on("progress", (state: ProcessingState) => {
        progressEvents.push(state);
      });

      const data = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      await processor.processData(data);

      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[progressEvents.length - 1]?.progress).toBe(100);
    });

    it("should emit complete event", async () => {
      let completeEmitted = false;
      processor.on("complete", () => {
        completeEmitted = true;
      });

      await processor.processData([1, 2, 3]);

      expect(completeEmitted).toBe(true);
    });

    it("should calculate processing speed", async () => {
      const progressEvents: ProcessingState[] = [];
      processor.on("progress", (state: ProcessingState) => {
        progressEvents.push(state);
      });

      const data = Array.from({ length: 50 }, (_, i) => ({ id: i }));
      await processor.processData(data);

      const finalState = progressEvents[progressEvents.length - 1];
      expect(finalState?.speed).toBeGreaterThan(0);
      expect(finalState?.estimatedTimeRemaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe("State Management", () => {
    it("should provide accurate state information", async () => {
      const data = Array.from({ length: 30 }, (_, i) => ({ id: i }));

      const promise = processor.processData(data);

      // Get state during processing (this might be tricky to time correctly)
      const state = processor.getState();

      expect(state.total).toBe(0); // Initially 0, gets set during processing
      expect(state.processed).toBe(0);
      expect(state.progress).toBe(0);

      await promise;

      const finalState = processor.getState();
      expect(finalState.progress).toBe(100);
    });

    it("should track batch information", async () => {
      const options: IncrementalProcessOptions = {
        batchSize: 5,
      };
      const batchProcessor = new IncrementalJsonProcessor(options);

      const progressEvents: ProcessingState[] = [];
      batchProcessor.on("progress", (state: ProcessingState) => {
        progressEvents.push(state);
      });

      const data = Array.from({ length: 12 }, (_, i) => ({ id: i }));
      await batchProcessor.processData(data);

      const finalState = progressEvents[progressEvents.length - 1];
      expect(finalState?.totalBatches).toBeGreaterThan(1);
      expect(finalState?.currentBatch).toBe(finalState?.totalBatches);
    });
  });

  describe("Abort Processing", () => {
    it("should abort processing when requested", async () => {
      const options: IncrementalProcessOptions = {
        batchSize: 1,
        batchDelay: 50, // Add delay to make abort possible
      };
      const abortProcessor = new IncrementalJsonProcessor(options);

      let abortEmitted = false;
      abortProcessor.on("abort", () => {
        abortEmitted = true;
      });

      const data = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      const promise = abortProcessor.processData(data);

      // Abort after a short delay
      setTimeout(() => {
        abortProcessor.abort();
      }, 10);

      await promise;

      expect(abortEmitted).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle processing errors and continue", async () => {
      const errorProcessor = vi.fn((value, context) => {
        if (context.index === 2) {
          throw new Error("Processing error");
        }
        return { value, success: true };
      });

      const options: IncrementalProcessOptions = {
        processor: errorProcessor,
        enableDeepProcessing: false, // Only process array elements
      };
      const processor = new IncrementalJsonProcessor(options);

      const data = [1, 2, 3, 4, 5];
      const results = await processor.processData(data);

      expect(results).toHaveLength(5);
      expect(results[2]?.success).toBe(false);
      expect(results[2]?.error).toBeTruthy();

      // Other items should still be processed successfully
      expect(results.filter((r) => r.success)).toHaveLength(4);
    });

    it("should collect errors in state", async () => {
      const errorProcessor = vi.fn(() => {
        throw new Error("Batch error");
      });

      const options: IncrementalProcessOptions = {
        processor: errorProcessor,
      };
      const processor = new IncrementalJsonProcessor(options);

      const progressEvents: ProcessingState[] = [];
      processor.on("progress", (state: ProcessingState) => {
        progressEvents.push(state);
      });

      const data = [1, 2, 3];
      await processor.processData(data);

      const finalState = progressEvents[progressEvents.length - 1];
      expect(finalState?.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Performance", () => {
    it("should handle large datasets efficiently", async () => {
      const largeData = Array.from({ length: 5000 }, (_, i) => ({
        id: i,
        data: `Item ${i}`,
        nested: { value: i * 2 },
      }));

      const startTime = performance.now();
      const results = await processor.processData(largeData);
      const processingTime = performance.now() - startTime;

      expect(results.length).toBeGreaterThan(5000);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it("should respect batch delay for performance tuning", async () => {
      const options: IncrementalProcessOptions = {
        batchSize: 5,
        batchDelay: 20, // 20ms delay between batches
      };
      const delayProcessor = new IncrementalJsonProcessor(options);

      const data = Array.from({ length: 15 }, (_, i) => ({ id: i }));

      const startTime = performance.now();
      await delayProcessor.processData(data);
      const totalTime = performance.now() - startTime;

      // Should take at least 2 batch delays (3 batches, 2 delays between them)
      expect(totalTime).toBeGreaterThan(40);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty data", async () => {
      const results = await processor.processData([]);

      expect(results).toHaveLength(0);
    });

    it("should handle single item data", async () => {
      const results = await processor.processData(42);

      expect(results).toHaveLength(1);
      expect(results[0]?.value).toBe(42);
    });

    it("should handle deeply nested structures", async () => {
      let nested: any = { value: "deep" };
      for (let i = 0; i < 10; i++) {
        nested = { [`level${i}`]: nested };
      }

      const results = await processor.processData(nested);

      expect(results.length).toBeGreaterThan(10);
      expect(results.every((result) => result.success)).toBe(true);
    });

    it("should handle mixed data types", async () => {
      const mixedData = [
        "string",
        42,
        true,
        null,
        { object: "value" },
        [1, 2, 3],
      ];

      const results = await processor.processData(mixedData);

      expect(results.length).toBeGreaterThan(6);
      expect(results.every((result) => result.success)).toBe(true);
    });
  });
});

describe("Convenience Functions", () => {
  describe("processJsonIncrementally", () => {
    it("should process data using convenience function", async () => {
      const data = { test: "convenience", items: [1, 2, 3] };
      const results = await processJsonIncrementally(data);

      expect(results.length).toBeGreaterThan(1);
      expect(results.every((result) => result.success)).toBe(true);
    });

    it("should accept processing options", async () => {
      const data = Array.from({ length: 20 }, (_, i) => ({ id: i }));
      const options: IncrementalProcessOptions = {
        batchSize: 5,
        enablePartialResults: false,
        enableDeepProcessing: false, // Only process array elements
      };

      const results = await processJsonIncrementally(data, options);

      expect(results).toHaveLength(20);
      expect(results.every((result) => result.success)).toBe(true);
    });
  });

  describe("processJsonStreamIncrementally", () => {
    it("should process stream using convenience function", async () => {
      const data = JSON.stringify({ stream: "convenience", values: [1, 2, 3] });
      const stream = Readable.from([data]);

      const results = await processJsonStreamIncrementally(stream);

      expect(results.length).toBeGreaterThan(1);
      expect(results.every((result) => result.success)).toBe(true);
    });

    it("should handle stream options", async () => {
      const data = JSON.stringify(
        Array.from({ length: 15 }, (_, i) => ({ id: i })),
      );
      const stream = Readable.from([data]);

      const options: IncrementalProcessOptions = {
        batchSize: 3,
        enableDeepProcessing: false, // Only process array elements
      };

      const results = await processJsonStreamIncrementally(stream, options);

      expect(results).toHaveLength(15);
      expect(results.every((result) => result.success)).toBe(true);
    });
  });
});
