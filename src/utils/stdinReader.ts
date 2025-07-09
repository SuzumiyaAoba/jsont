/**
 * Enhanced stdin reader with robust handling
 * T2.1: JSON基本処理とパース機能
 */

import { createReadStream } from "node:fs";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { JsonValue } from "../types/index";
import { extractJsonFromText, parseJsonWithValidation } from "./jsonProcessor";

export interface StdinReadOptions {
  timeout?: number; // milliseconds
  maxSize?: number; // bytes
  encoding?: BufferEncoding;
  detectFormat?: boolean;
  extractFromText?: boolean;
}

export interface StdinReadResult {
  success: boolean;
  data: JsonValue | null;
  error: string | null;
  stats: {
    bytesRead: number;
    readTime: number;
    encoding: string;
    source: "stdin" | "file" | "pipe";
  };
}

/**
 * Read and parse JSON from stdin with enhanced error handling
 */
export async function readJsonFromStdin(
  options: StdinReadOptions = {},
): Promise<StdinReadResult> {
  const {
    timeout = 30000, // 30 seconds default
    maxSize = 100 * 1024 * 1024, // 100MB default
    encoding = "utf8",
    // detectFormat = true,
    extractFromText = false,
  } = options;

  const startTime = performance.now();
  let bytesRead = 0;
  let inputData = "";

  // Check if stdin is available
  if (process.stdin.isTTY) {
    return {
      success: false,
      data: null,
      error: "No input available - stdin is connected to a terminal",
      stats: {
        bytesRead: 0,
        readTime: performance.now() - startTime,
        encoding,
        source: "stdin",
      },
    };
  }

  try {
    // Set up timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Stdin read timeout after ${timeout}ms`));
      }, timeout);
    });

    // Set up size limit transform
    const sizeLimitTransform = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        bytesRead += chunk.length;
        if (bytesRead > maxSize) {
          callback(
            new Error(`Input exceeds maximum size limit of ${maxSize} bytes`),
          );
          return;
        }
        callback(null, chunk);
      },
    });

    // Read from stdin with size limit
    const readPromise = (async () => {
      process.stdin.setEncoding(encoding);

      const chunks: string[] = [];

      // Use pipeline for proper error handling
      await pipeline(
        process.stdin,
        sizeLimitTransform,
        new Transform({
          objectMode: true,
          transform(chunk: Buffer, _encoding, callback) {
            chunks.push(chunk.toString(encoding));
            callback();
          },
        }),
      );

      return chunks.join("");
    })();

    // Race between read and timeout
    inputData = await Promise.race([readPromise, timeoutPromise]);

    if (!inputData.trim()) {
      return {
        success: false,
        data: null,
        error: "No data received from stdin",
        stats: {
          bytesRead,
          readTime: performance.now() - startTime,
          encoding,
          source: "stdin",
        },
      };
    }

    // Try to extract JSON from text if enabled
    if (extractFromText) {
      const extractedJson = extractJsonFromText(inputData);
      if (extractedJson.length > 0) {
        inputData = extractedJson[0] ?? ""; // Use first found JSON
      }
    }

    // Parse the JSON
    const parseResult = parseJsonWithValidation(inputData);

    return {
      success: parseResult.success,
      data: parseResult.data,
      error: parseResult.error,
      stats: {
        bytesRead,
        readTime: performance.now() - startTime,
        encoding,
        source: determineInputSource(),
      },
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "Unknown error reading stdin",
      stats: {
        bytesRead,
        readTime: performance.now() - startTime,
        encoding,
        source: "stdin",
      },
    };
  }
}

/**
 * Read JSON from file with same interface as stdin
 */
export async function readJsonFromFile(
  filePath: string,
  options: StdinReadOptions = {},
): Promise<StdinReadResult> {
  const { maxSize = 100 * 1024 * 1024, encoding = "utf8" } = options;

  const startTime = performance.now();
  let bytesRead = 0;

  try {
    // Create size-limited transform
    const sizeLimitTransform = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        bytesRead += chunk.length;
        if (bytesRead > maxSize) {
          callback(
            new Error(`File exceeds maximum size limit of ${maxSize} bytes`),
          );
          return;
        }
        callback(null, chunk);
      },
    });

    const chunks: Buffer[] = [];

    await pipeline(
      createReadStream(filePath),
      sizeLimitTransform,
      new Transform({
        objectMode: true,
        transform(chunk: Buffer, _encoding, callback) {
          chunks.push(chunk);
          callback();
        },
      }),
    );

    const inputData = Buffer.concat(chunks).toString(encoding);

    if (!inputData.trim()) {
      return {
        success: false,
        data: null,
        error: "File is empty or contains only whitespace",
        stats: {
          bytesRead,
          readTime: performance.now() - startTime,
          encoding,
          source: "file",
        },
      };
    }

    const parseResult = parseJsonWithValidation(inputData);

    return {
      success: parseResult.success,
      data: parseResult.data,
      error: parseResult.error,
      stats: {
        bytesRead,
        readTime: performance.now() - startTime,
        encoding,
        source: "file",
      },
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "Unknown error reading file",
      stats: {
        bytesRead,
        readTime: performance.now() - startTime,
        encoding,
        source: "file",
      },
    };
  }
}

/**
 * Determine the source of input data
 */
function determineInputSource(): "stdin" | "file" | "pipe" {
  if (process.stdin.isTTY) {
    return "stdin";
  }

  // Check if input is from a pipe vs file redirection
  // This is a heuristic and may not be 100% accurate
  const stat = (
    process.stdin as unknown as { _readableState?: { fd?: number } }
  )._readableState;
  if (stat && "fd" in stat && stat.fd === 0) {
    return "pipe";
  }

  return "stdin";
}

/**
 * Stream-based JSON processor for very large inputs
 */
export class StreamingJsonProcessor {
  private chunks: string[] = [];
  private bytesProcessed = 0;
  private maxSize: number;

  constructor(maxSize = 500 * 1024 * 1024) {
    // 500MB default for streaming
    this.maxSize = maxSize;
  }

  async processStream(
    inputStream: NodeJS.ReadableStream,
    encoding: BufferEncoding = "utf8",
  ): Promise<StdinReadResult> {
    const startTime = performance.now();

    return new Promise((resolve) => {
      inputStream.setEncoding(encoding);

      inputStream.on("data", (chunk: string) => {
        this.bytesProcessed += Buffer.byteLength(chunk, encoding);

        if (this.bytesProcessed > this.maxSize) {
          resolve({
            success: false,
            data: null,
            error: `Stream exceeds maximum size limit of ${this.maxSize} bytes`,
            stats: {
              bytesRead: this.bytesProcessed,
              readTime: performance.now() - startTime,
              encoding,
              source: "pipe",
            },
          });
          return;
        }

        this.chunks.push(chunk);
      });

      inputStream.on("end", () => {
        const inputData = this.chunks.join("");
        const parseResult = parseJsonWithValidation(inputData);

        resolve({
          success: parseResult.success,
          data: parseResult.data,
          error: parseResult.error,
          stats: {
            bytesRead: this.bytesProcessed,
            readTime: performance.now() - startTime,
            encoding,
            source: "pipe",
          },
        });
      });

      inputStream.on("error", (error) => {
        resolve({
          success: false,
          data: null,
          error: error.message,
          stats: {
            bytesRead: this.bytesProcessed,
            readTime: performance.now() - startTime,
            encoding,
            source: "pipe",
          },
        });
      });
    });
  }
}

/**
 * Auto-detect and read JSON from various sources
 */
export async function autoReadJson(
  source?: string,
  options: StdinReadOptions = {},
): Promise<StdinReadResult> {
  // If source is provided, treat as file path
  if (source) {
    return readJsonFromFile(source, options);
  }

  // Otherwise read from stdin
  return readJsonFromStdin(options);
}
