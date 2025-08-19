/**
 * Worker thread script for incremental JSON processing
 * This file is executed in a separate worker thread to process JSON batches in parallel
 */

import { parentPort } from "node:worker_threads";
import type { JsonValue } from "@core/types";

interface ProcessingContext {
  index: number;
  path: string[];
  depth: number;
}

interface WorkerBatchItem {
  value: JsonValue;
  context: ProcessingContext;
}

interface ProcessingResult {
  value: JsonValue;
  metadata?: Record<string, any>;
  success: boolean;
  error?: string;
}

interface WorkerMessage {
  batch: WorkerBatchItem[];
  workerIndex: number;
}

interface WorkerResponse {
  success: boolean;
  results?: ProcessingResult[];
  error?: string;
}

if (!parentPort) {
  throw new Error("This script must be run as a worker thread");
}

parentPort.on("message", (message: WorkerMessage) => {
  try {
    // Process batch items
    const processedItems: ProcessingResult[] = message.batch.map((item) => ({
      value: item.value,
      metadata: {
        workerIndex: message.workerIndex,
        processed: true,
        processedAt: Date.now(),
      },
      success: true,
    }));

    const response: WorkerResponse = {
      success: true,
      results: processedItems,
    };

    parentPort?.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };

    parentPort?.postMessage(response);
  }
});
