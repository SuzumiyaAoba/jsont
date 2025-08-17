/**
 * Tests for PerformanceOptimizer
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type OptimizationStrategy,
  PerformanceMonitor,
  PerformanceOptimizer,
  type PerformanceProfile,
} from "./performanceOptimizer";

describe("PerformanceOptimizer", () => {
  describe("Performance Profile Creation", () => {
    it("should create profile for small data", async () => {
      const profile = await PerformanceOptimizer.createPerformanceProfile(
        undefined,
        1024,
      ); // 1KB

      expect(profile.fileSize).toBe(1024);
      expect(profile.estimatedObjects).toBeGreaterThan(0);
      expect(profile.estimatedDepth).toBeGreaterThan(0);
      expect(profile.complexity).toBe("low");
      expect(profile.availableMemory).toBeGreaterThan(0);
      expect(profile.cpuCores).toBeGreaterThan(0);
    });

    it("should create profile for medium data", async () => {
      const profile = await PerformanceOptimizer.createPerformanceProfile(
        undefined,
        5 * 1024 * 1024,
      ); // 5MB

      expect(profile.fileSize).toBe(5 * 1024 * 1024);
      expect(profile.complexity).toBe("medium");
    });

    it("should create profile for large data", async () => {
      const profile = await PerformanceOptimizer.createPerformanceProfile(
        undefined,
        50 * 1024 * 1024,
      ); // 50MB

      expect(profile.fileSize).toBe(50 * 1024 * 1024);
      expect(profile.complexity).toBe("high");
    });

    it("should handle file stat errors gracefully", async () => {
      const profile = await PerformanceOptimizer.createPerformanceProfile(
        "/non/existent/file.json",
      );

      expect(profile.fileSize).toBe(0);
      expect(profile.complexity).toBe("low");
    });
  });

  describe("Optimization Strategy Generation", () => {
    it("should generate strategy for small files", () => {
      const profile: PerformanceProfile = {
        fileSize: 1024, // 1KB
        estimatedObjects: 10,
        estimatedDepth: 3,
        availableMemory: 1024 * 1024 * 1024, // 1GB
        cpuCores: 4,
        complexity: "low",
      };

      const strategy =
        PerformanceOptimizer.generateOptimizationStrategy(profile);

      expect(strategy.useStreaming).toBe(false);
      expect(strategy.useVirtualization).toBe(false);
      expect(strategy.useIncremental).toBe(false);
      expect(strategy.useWorkerThreads).toBe(false);
    });

    it("should generate strategy for medium files", () => {
      const profile: PerformanceProfile = {
        fileSize: 20 * 1024 * 1024, // 20MB
        estimatedObjects: 1000,
        estimatedDepth: 8,
        availableMemory: 1024 * 1024 * 1024, // 1GB
        cpuCores: 4,
        complexity: "medium",
      };

      const strategy =
        PerformanceOptimizer.generateOptimizationStrategy(profile);

      expect(strategy.useStreaming).toBe(true);
      expect(strategy.useVirtualization).toBe(true);
      expect(strategy.chunkSize).toBeGreaterThan(64 * 1024);
    });

    it("should generate strategy for large files", () => {
      const profile: PerformanceProfile = {
        fileSize: 200 * 1024 * 1024, // 200MB
        estimatedObjects: 100000,
        estimatedDepth: 15,
        availableMemory: 1024 * 1024 * 1024, // 1GB
        cpuCores: 8,
        complexity: "high",
      };

      const strategy =
        PerformanceOptimizer.generateOptimizationStrategy(profile);

      expect(strategy.useStreaming).toBe(true);
      expect(strategy.useVirtualization).toBe(true);
      expect(strategy.useIncremental).toBe(true);
      expect(strategy.useWorkerThreads).toBe(true);
      expect(strategy.chunkSize).toBeGreaterThan(256 * 1024);
      expect(strategy.batchSize).toBeGreaterThan(1000);
    });

    it("should generate strategy for very large files", () => {
      const profile: PerformanceProfile = {
        fileSize: 2 * 1024 * 1024 * 1024, // 2GB
        estimatedObjects: 1000000,
        estimatedDepth: 20,
        availableMemory: 4 * 1024 * 1024 * 1024, // 4GB
        cpuCores: 16,
        complexity: "high",
      };

      const strategy =
        PerformanceOptimizer.generateOptimizationStrategy(profile);

      expect(strategy.useStreaming).toBe(true);
      expect(strategy.useVirtualization).toBe(true);
      expect(strategy.useIncremental).toBe(true);
      expect(strategy.useWorkerThreads).toBe(true);
      expect(strategy.chunkSize).toBe(1024 * 1024); // 1MB
      expect(strategy.batchSize).toBe(5000);
    });

    it("should adjust strategy for low memory", () => {
      const profile: PerformanceProfile = {
        fileSize: 100 * 1024 * 1024, // 100MB
        estimatedObjects: 10000,
        estimatedDepth: 10,
        availableMemory: 128 * 1024 * 1024, // 128MB (low memory)
        cpuCores: 2,
        complexity: "medium",
      };

      const strategy =
        PerformanceOptimizer.generateOptimizationStrategy(profile);

      expect(strategy.useStreaming).toBe(true);
      expect(strategy.bufferSize).toBeLessThanOrEqual(8 * 1024 * 1024); // Should be capped at 8MB
      expect(strategy.batchSize).toBeLessThanOrEqual(500);
      expect(strategy.memoryLimit).toBeLessThan(profile.availableMemory * 0.2);
    });

    it("should adjust strategy for high complexity", () => {
      const profile: PerformanceProfile = {
        fileSize: 50 * 1024 * 1024, // 50MB
        estimatedObjects: 5000,
        estimatedDepth: 5,
        availableMemory: 1024 * 1024 * 1024, // 1GB
        cpuCores: 4,
        complexity: "high",
      };

      const strategy =
        PerformanceOptimizer.generateOptimizationStrategy(profile);

      expect(strategy.useStreaming).toBe(true);
      expect(strategy.useVirtualization).toBe(true);
      expect(strategy.useIncremental).toBe(true);
      // Batch size should be reduced for complex data
      expect(strategy.batchSize).toBeLessThan(1000);
    });
  });

  describe("Optimized Component Creation", () => {
    let strategy: OptimizationStrategy;

    beforeEach(() => {
      strategy = {
        useStreaming: true,
        useVirtualization: true,
        useIncremental: true,
        useWorkerThreads: true,
        chunkSize: 1024 * 1024,
        batchSize: 2000,
        bufferSize: 64 * 1024 * 1024,
        memoryLimit: 256 * 1024 * 1024,
      };
    });

    it("should create optimized streaming parser", () => {
      const parser =
        PerformanceOptimizer.createOptimizedStreamingParser(strategy);

      expect(parser).toBeDefined();
      expect(parser["options"].maxBufferSize).toBe(strategy.bufferSize);
      expect(parser["options"].chunkSize).toBe(strategy.chunkSize);
    });

    it("should create optimized renderer when virtualization enabled", () => {
      const renderer = PerformanceOptimizer.createOptimizedRenderer(
        strategy,
        20,
      );

      expect(renderer).toBeDefined();
      expect(renderer).not.toBeNull();
    });

    it("should return null renderer when virtualization disabled", () => {
      strategy.useVirtualization = false;
      const renderer = PerformanceOptimizer.createOptimizedRenderer(
        strategy,
        20,
      );

      expect(renderer).toBeNull();
    });

    it("should create optimized processor when incremental enabled", () => {
      const processor = PerformanceOptimizer.createOptimizedProcessor(strategy);

      expect(processor).toBeDefined();
      expect(processor).not.toBeNull();
    });

    it("should return null processor when incremental disabled", () => {
      strategy.useIncremental = false;
      const processor = PerformanceOptimizer.createOptimizedProcessor(strategy);

      expect(processor).toBeNull();
    });
  });

  describe("Performance Monitoring", () => {
    it("should create performance monitor", () => {
      const monitor = PerformanceOptimizer.createPerformanceMonitor();

      expect(monitor).toBeDefined();
      expect(monitor).toBeInstanceOf(PerformanceMonitor);
    });
  });

  describe("JSON Structure Optimization", () => {
    it("should optimize simple JSON structure", () => {
      const data = { name: "test", value: 42 };
      const optimized = PerformanceOptimizer.optimizeJsonStructure(data);

      expect(optimized).toEqual(data);
    });

    it("should handle circular references", () => {
      const data: any = { name: "test" };
      data.self = data; // Create circular reference

      const optimized = PerformanceOptimizer.optimizeJsonStructure(data);

      expect(optimized).toBeDefined();
      expect(optimized).toHaveProperty("name", "test");
      expect(optimized).toHaveProperty("self", "[Circular Reference]");
    });

    it("should optimize nested structures", () => {
      const data = {
        level1: {
          level2: {
            level3: ["item1", "item2"],
          },
        },
      };

      const optimized = PerformanceOptimizer.optimizeJsonStructure(data);

      expect(optimized).toEqual(data);
    });

    it("should handle arrays with mixed types", () => {
      const data = [1, "string", { nested: "object" }, [1, 2, 3]];

      const optimized = PerformanceOptimizer.optimizeJsonStructure(data);

      expect(optimized).toEqual(data);
    });
  });

  describe("Memory Estimation", () => {
    it("should estimate memory usage for small objects", () => {
      const data = { small: "object" };
      const estimation = PerformanceOptimizer.estimateMemoryUsage(data);

      expect(estimation).toBeGreaterThan(0);
      expect(estimation).toBeLessThan(1024 * 1024); // Should be less than 1MB
    });

    it("should estimate memory usage for large objects", () => {
      const data = {
        large: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          data: "x".repeat(100),
        })),
      };

      const estimation = PerformanceOptimizer.estimateMemoryUsage(data);

      expect(estimation).toBeGreaterThan(100 * 1024); // Should be > 100KB
    });
  });

  describe("Processing Capability Check", () => {
    it("should return true for manageable processing", () => {
      const profile: PerformanceProfile = {
        fileSize: 1024 * 1024, // 1MB
        estimatedObjects: 1000,
        estimatedDepth: 5,
        availableMemory: 1024 * 1024 * 1024, // 1GB
        cpuCores: 4,
        complexity: "low",
      };

      const strategy =
        PerformanceOptimizer.generateOptimizationStrategy(profile);
      const canHandle = PerformanceOptimizer.canHandleProcessing(
        profile,
        strategy,
      );

      expect(canHandle).toBe(true);
    });

    it("should return false for excessive memory requirements", () => {
      const profile: PerformanceProfile = {
        fileSize: 10 * 1024 * 1024 * 1024, // 10GB
        estimatedObjects: 10000000,
        estimatedDepth: 50,
        availableMemory: 128 * 1024 * 1024, // 128MB
        cpuCores: 1,
        complexity: "high",
      };

      const strategy =
        PerformanceOptimizer.generateOptimizationStrategy(profile);
      const canHandle = PerformanceOptimizer.canHandleProcessing(
        profile,
        strategy,
      );

      expect(canHandle).toBe(false);
    });
  });
});

describe("PerformanceMonitor", () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe("Basic Monitoring", () => {
    it("should track parsing time", () => {
      monitor.start();
      monitor.startParse();

      // Simulate some work
      const work = Array.from({ length: 1000 }, (_, i) => i * 2);
      expect(work.length).toBe(1000);

      const parseTime = monitor.endParse();

      expect(parseTime).toBeGreaterThanOrEqual(0);
    });

    it("should track rendering time", () => {
      monitor.start();
      monitor.startRender();

      // Simulate some work
      const work = Array.from({ length: 1000 }, (_, i) => i * 2);
      expect(work.length).toBe(1000);

      const renderTime = monitor.endRender();

      expect(renderTime).toBeGreaterThanOrEqual(0);
    });

    it("should track object count", () => {
      monitor.start();
      monitor.updateObjectCount(1000);

      const metrics = monitor.getMetrics();

      expect(metrics.throughput).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Memory Tracking", () => {
    it("should track memory usage", () => {
      monitor.start();

      // Simulate memory allocation
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        data: "x".repeat(100),
      }));
      monitor.updateObjectCount(largeArray.length);

      const metrics = monitor.getMetrics();

      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.peakMemoryUsage).toBeGreaterThanOrEqual(
        metrics.memoryUsage,
      );
    });

    it("should calculate memory efficiency", () => {
      monitor.start();
      monitor.updateObjectCount(1000);

      const metrics = monitor.getMetrics();

      expect(metrics.memoryEfficiency).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Performance Metrics", () => {
    it("should provide comprehensive metrics", () => {
      monitor.start();
      monitor.startParse();
      monitor.endParse();
      monitor.startRender();
      monitor.endRender();
      monitor.updateObjectCount(500);

      const metrics = monitor.getMetrics();

      expect(metrics).toHaveProperty("parseTime");
      expect(metrics).toHaveProperty("renderTime");
      expect(metrics).toHaveProperty("memoryUsage");
      expect(metrics).toHaveProperty("peakMemoryUsage");
      expect(metrics).toHaveProperty("throughput");
      expect(metrics).toHaveProperty("memoryEfficiency");

      expect(metrics.parseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.peakMemoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.throughput).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryEfficiency).toBeGreaterThanOrEqual(0);
    });

    it("should calculate throughput correctly", () => {
      monitor.start();

      // Simulate processing
      setTimeout(() => {
        monitor.updateObjectCount(1000);
      }, 10);

      setTimeout(() => {
        const metrics = monitor.getMetrics();
        expect(metrics.throughput).toBeGreaterThan(0);
      }, 20);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero object count", () => {
      monitor.start();

      const metrics = monitor.getMetrics();

      expect(metrics.throughput).toBe(0);
      expect(metrics.memoryEfficiency).toBe(0);
    });

    it("should handle immediate metrics request", () => {
      monitor.start();

      const metrics = monitor.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.parseTime).toBe(0);
      expect(metrics.renderTime).toBe(0);
    });
  });
});
