/**
 * Performance Optimizer for Large JSON Processing
 *
 * Intelligent optimization strategies for handling large JSON files efficiently.
 * Includes memory management, processing strategies, and performance monitoring.
 */

import type { JsonValue } from "@core/types/index";
import {
  IncrementalJsonProcessor,
  type IncrementalProcessOptions,
} from "./incrementalProcessor";
import {
  StreamingJsonParser,
  type StreamingParseOptions,
} from "./streamingJsonParser";
import {
  VirtualizedJsonRenderer,
  type VirtualizedRenderOptions,
} from "./virtualizedRenderer";

export interface PerformanceProfile {
  /** File size in bytes */
  fileSize: number;
  /** Estimated object count */
  estimatedObjects: number;
  /** Maximum nesting depth */
  estimatedDepth: number;
  /** Available system memory */
  availableMemory: number;
  /** CPU core count */
  cpuCores: number;
  /** Processing complexity (low, medium, high) */
  complexity: "low" | "medium" | "high";
}

export interface OptimizationStrategy {
  /** Use streaming parser */
  useStreaming: boolean;
  /** Use virtualized rendering */
  useVirtualization: boolean;
  /** Use incremental processing */
  useIncremental: boolean;
  /** Use worker threads */
  useWorkerThreads: boolean;
  /** Recommended chunk size */
  chunkSize: number;
  /** Recommended batch size */
  batchSize: number;
  /** Recommended buffer size */
  bufferSize: number;
  /** Memory limit per operation */
  memoryLimit: number;
}

export interface PerformanceMetrics {
  /** Parse time in milliseconds */
  parseTime: number;
  /** Render time in milliseconds */
  renderTime: number;
  /** Memory usage in bytes */
  memoryUsage: number;
  /** Peak memory usage in bytes */
  peakMemoryUsage: number;
  /** Objects processed per second */
  throughput: number;
  /** Memory efficiency (objects per MB) */
  memoryEfficiency: number;
}

/**
 * Intelligent performance optimizer for JSON processing
 */
export class PerformanceOptimizer {
  private static readonly SIZE_THRESHOLDS = {
    SMALL: 1024 * 1024, // 1MB
    MEDIUM: 10 * 1024 * 1024, // 10MB
    LARGE: 100 * 1024 * 1024, // 100MB
    XLARGE: 1024 * 1024 * 1024, // 1GB
  };

  private static readonly MEMORY_THRESHOLDS = {
    LOW: 256 * 1024 * 1024, // 256MB
    MEDIUM: 1024 * 1024 * 1024, // 1GB
    HIGH: 4 * 1024 * 1024 * 1024, // 4GB
  };

  /**
   * Analyze file and create performance profile
   */
  static async createPerformanceProfile(
    filePath?: string,
    dataSize?: number,
  ): Promise<PerformanceProfile> {
    const systemInfo = PerformanceOptimizer.getSystemInfo();

    let fileSize = dataSize || 0;

    if (filePath && !dataSize) {
      try {
        const fs = await import("node:fs/promises");
        const stats = await fs.stat(filePath);
        fileSize = stats.size;
      } catch {
        fileSize = 0;
      }
    }

    // Estimate object count and depth based on file size
    const estimatedObjects = Math.ceil(fileSize / 100); // Rough estimate
    const estimatedDepth = Math.min(
      20,
      Math.ceil(Math.log10(estimatedObjects)),
    );

    let complexity: "low" | "medium" | "high" = "low";
    if (
      fileSize > PerformanceOptimizer.SIZE_THRESHOLDS.LARGE ||
      (fileSize > PerformanceOptimizer.SIZE_THRESHOLDS.MEDIUM &&
        estimatedDepth > 5)
    ) {
      complexity = "high";
    } else if (
      fileSize > PerformanceOptimizer.SIZE_THRESHOLDS.SMALL ||
      estimatedDepth > 5
    ) {
      complexity = "medium";
    }

    return {
      fileSize,
      estimatedObjects,
      estimatedDepth,
      availableMemory: systemInfo.availableMemory,
      cpuCores: systemInfo.cpuCores,
      complexity,
    };
  }

  /**
   * Generate optimization strategy based on performance profile
   */
  static generateOptimizationStrategy(
    profile: PerformanceProfile,
  ): OptimizationStrategy {
    const {
      fileSize,
      estimatedObjects,
      complexity,
      availableMemory,
      cpuCores,
    } = profile;

    // Base strategy
    let strategy: OptimizationStrategy = {
      useStreaming: false,
      useVirtualization: false,
      useIncremental: false,
      useWorkerThreads: false,
      chunkSize: 64 * 1024, // 64KB
      batchSize: 1000,
      bufferSize: 16 * 1024 * 1024, // 16MB
      memoryLimit: Math.floor(availableMemory * 0.25), // Use 25% of available memory
    };

    // Optimize based on file size
    if (fileSize > PerformanceOptimizer.SIZE_THRESHOLDS.XLARGE) {
      // Very large files (>1GB)
      strategy = {
        ...strategy,
        useStreaming: true,
        useVirtualization: true,
        useIncremental: true,
        useWorkerThreads: cpuCores > 2,
        chunkSize: 1024 * 1024, // 1MB chunks
        batchSize: 5000,
        bufferSize: Math.min(
          128 * 1024 * 1024,
          Math.floor(availableMemory * 0.1),
        ), // 128MB or 10% of memory
      };
    } else if (fileSize > PerformanceOptimizer.SIZE_THRESHOLDS.LARGE) {
      // Large files (>100MB)
      strategy = {
        ...strategy,
        useStreaming: true,
        useVirtualization: true,
        useIncremental: estimatedObjects > 10000,
        useWorkerThreads: cpuCores > 2,
        chunkSize: 512 * 1024, // 512KB chunks
        batchSize: 2000,
        bufferSize: Math.min(
          64 * 1024 * 1024,
          Math.floor(availableMemory * 0.15),
        ), // 64MB or 15% of memory
      };
    } else if (fileSize > PerformanceOptimizer.SIZE_THRESHOLDS.MEDIUM) {
      // Medium files (>10MB)
      strategy = {
        ...strategy,
        useStreaming: true,
        useVirtualization: estimatedObjects >= 1000,
        useIncremental: estimatedObjects > 5000,
        useWorkerThreads: cpuCores > 4 && estimatedObjects > 10000,
        chunkSize: 256 * 1024, // 256KB chunks
        batchSize: 1000,
        bufferSize: 32 * 1024 * 1024, // 32MB
      };
    } else if (fileSize > PerformanceOptimizer.SIZE_THRESHOLDS.SMALL) {
      // Small to medium files (>1MB)
      strategy = {
        ...strategy,
        useVirtualization: estimatedObjects > 500,
        useIncremental: false,
        chunkSize: 128 * 1024, // 128KB chunks
        batchSize: 500,
        bufferSize: 16 * 1024 * 1024, // 16MB
      };
    }

    // Adjust for memory constraints
    if (availableMemory < PerformanceOptimizer.MEMORY_THRESHOLDS.LOW) {
      strategy = {
        ...strategy,
        useStreaming: true,
        bufferSize: Math.min(strategy.bufferSize, 8 * 1024 * 1024), // Max 8MB
        batchSize: Math.min(strategy.batchSize, 500),
        memoryLimit: Math.floor(availableMemory * 0.15), // Use only 15% of available memory
      };
    }

    // Adjust for complexity (only for smaller files, large files already optimized)
    if (
      complexity === "high" &&
      fileSize <= PerformanceOptimizer.SIZE_THRESHOLDS.LARGE
    ) {
      strategy = {
        ...strategy,
        useStreaming: true,
        useVirtualization: true,
        useIncremental: true,
        batchSize: Math.floor(strategy.batchSize * 0.75), // Smaller batches for complex data
      };
    }

    return strategy;
  }

  /**
   * Create optimized streaming parser
   */
  static createOptimizedStreamingParser(
    strategy: OptimizationStrategy,
  ): StreamingJsonParser {
    const options: StreamingParseOptions = {
      maxBufferSize: strategy.bufferSize,
      chunkSize: strategy.chunkSize,
      enableProgress: true,
      maxObjects: strategy.useStreaming ? Number.MAX_SAFE_INTEGER : 100000,
    };

    return new StreamingJsonParser(options);
  }

  /**
   * Create optimized virtualized renderer
   */
  static createOptimizedRenderer(
    strategy: OptimizationStrategy,
    viewportHeight: number,
  ): VirtualizedJsonRenderer | null {
    if (!strategy.useVirtualization) {
      return null;
    }

    const options: VirtualizedRenderOptions = {
      viewportHeight,
      itemHeight: 1,
      overscan: 10,
      maxItems: strategy.memoryLimit / 1000, // Rough estimate
      showLineNumbers: true,
      initialExpandLevel: strategy.useVirtualization ? 1 : 3,
    };

    return new VirtualizedJsonRenderer(options);
  }

  /**
   * Create optimized incremental processor
   */
  static createOptimizedProcessor(
    strategy: OptimizationStrategy,
  ): IncrementalJsonProcessor | null {
    if (!strategy.useIncremental) {
      return null;
    }

    const options: IncrementalProcessOptions = {
      batchSize: strategy.batchSize,
      batchDelay: strategy.useWorkerThreads ? 5 : 10,
      useWorkerThreads: strategy.useWorkerThreads,
      maxWorkers: strategy.useWorkerThreads
        ? Math.min(
            4,
            Math.floor(
              process.env.UV_THREADPOOL_SIZE
                ? parseInt(process.env.UV_THREADPOOL_SIZE)
                : 4,
            ),
          )
        : 1,
      enablePartialResults: true,
    };

    return new IncrementalJsonProcessor(options);
  }

  /**
   * Monitor performance during processing
   */
  static createPerformanceMonitor(): PerformanceMonitor {
    return new PerformanceMonitor();
  }

  /**
   * Get system information
   */
  private static getSystemInfo(): {
    availableMemory: number;
    cpuCores: number;
  } {
    const os = require("os");

    return {
      availableMemory: os.freemem(),
      cpuCores: os.cpus().length,
    };
  }

  /**
   * Optimize JSON data structure for processing
   */
  static optimizeJsonStructure(data: JsonValue): JsonValue {
    // Remove circular references
    const seen = new WeakSet();

    const optimize = (obj: any): any => {
      if (obj === null || typeof obj !== "object") {
        return obj;
      }

      if (seen.has(obj)) {
        return "[Circular Reference]";
      }

      seen.add(obj);

      if (Array.isArray(obj)) {
        return obj.map(optimize);
      }

      const optimized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        optimized[key] = optimize(value);
      }

      return optimized;
    };

    return optimize(data);
  }

  /**
   * Estimate memory usage for JSON data
   */
  static estimateMemoryUsage(data: JsonValue): number {
    const jsonString = JSON.stringify(data);
    // Rough estimate: JSON string size * 3 (for parsing overhead) + reasonable base
    const baseOverhead = Math.max(1024, jsonString.length * 0.1); // Minimum 1KB or 10% of string size
    return jsonString.length * 3 + baseOverhead;
  }

  /**
   * Check if system can handle processing
   */
  static canHandleProcessing(
    profile: PerformanceProfile,
    strategy: OptimizationStrategy,
  ): boolean {
    // Estimate memory usage based on file size and processing strategy
    let estimatedMemoryUsage = profile.fileSize * 0.5; // Assume file will use 50% of its size in memory

    if (strategy.useStreaming) {
      // Streaming reduces memory usage significantly
      estimatedMemoryUsage = Math.max(
        strategy.bufferSize,
        profile.fileSize * 0.1,
      );
    }

    if (strategy.useIncremental) {
      // Incremental processing further reduces memory usage
      estimatedMemoryUsage = Math.max(
        strategy.bufferSize,
        estimatedMemoryUsage * 0.5,
      );
    }

    return estimatedMemoryUsage <= strategy.memoryLimit;
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private startTime = 0;
  private parseStartTime = 0;
  private renderStartTime = 0;
  private initialMemoryUsage = 0;
  private peakMemoryUsage = 0;
  private objectsProcessed = 0;

  /**
   * Start monitoring
   */
  start(): void {
    this.startTime = performance.now();
    this.initialMemoryUsage = process.memoryUsage().heapUsed;
    this.peakMemoryUsage = this.initialMemoryUsage;
  }

  /**
   * Mark parse start
   */
  startParse(): void {
    this.parseStartTime = performance.now();
  }

  /**
   * Mark parse end
   */
  endParse(): number {
    this.updateMemoryUsage();
    return performance.now() - this.parseStartTime;
  }

  /**
   * Mark render start
   */
  startRender(): void {
    this.renderStartTime = performance.now();
  }

  /**
   * Mark render end
   */
  endRender(): number {
    this.updateMemoryUsage();
    return performance.now() - this.renderStartTime;
  }

  /**
   * Update object count
   */
  updateObjectCount(count: number): void {
    this.objectsProcessed = count;
    this.updateMemoryUsage();
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    const totalTime = performance.now() - this.startTime;
    const currentMemoryUsage = process.memoryUsage().heapUsed;

    return {
      parseTime:
        this.parseStartTime > 0 ? performance.now() - this.parseStartTime : 0,
      renderTime:
        this.renderStartTime > 0 ? performance.now() - this.renderStartTime : 0,
      memoryUsage: currentMemoryUsage - this.initialMemoryUsage,
      peakMemoryUsage: this.peakMemoryUsage - this.initialMemoryUsage,
      throughput:
        totalTime > 0 ? (this.objectsProcessed / totalTime) * 1000 : 0,
      memoryEfficiency:
        currentMemoryUsage > 0
          ? this.objectsProcessed / (currentMemoryUsage / 1024 / 1024)
          : 0,
    };
  }

  /**
   * Update memory usage tracking
   */
  private updateMemoryUsage(): void {
    const current = process.memoryUsage().heapUsed;
    this.peakMemoryUsage = Math.max(this.peakMemoryUsage, current);
  }
}
