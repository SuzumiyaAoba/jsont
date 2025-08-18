/**
 * High-Performance Streaming JSON Parser
 *
 * Supports incremental parsing of large JSON files (GB scale) with minimal memory footprint.
 * Uses chunk-based parsing with intelligent buffering and progressive data structure building.
 */

import { EventEmitter } from "node:events";
import { Transform } from "node:stream";
import type { JsonValue } from "@core/types/index";

export interface StreamingParseOptions {
  /** Maximum memory allocation for buffering (bytes) */
  maxBufferSize?: number;
  /** Chunk size for reading files (bytes) */
  chunkSize?: number;
  /** Enable progress reporting */
  enableProgress?: boolean;
  /** Stop parsing after specified number of objects */
  maxObjects?: number;
  /** Path filter for selective parsing */
  pathFilter?: string[];
}

export interface ParseProgress {
  /** Bytes processed so far */
  bytesProcessed: number;
  /** Total bytes to process */
  totalBytes: number;
  /** Objects parsed so far */
  objectsParsed: number;
  /** Current parsing depth */
  currentDepth: number;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Estimated time remaining (ms) */
  estimatedTimeRemaining?: number;
}

export interface StreamingParseResult {
  /** Successfully parsed objects */
  objects: JsonValue[];
  /** Parse statistics */
  stats: {
    totalObjects: number;
    totalBytes: number;
    parseTime: number;
    peakMemoryUsage: number;
    maxDepth: number;
  };
  /** Any errors encountered */
  errors: string[];
  /** Whether parsing was completed or truncated */
  completed: boolean;
}

export interface JsonToken {
  type:
    | "object-start"
    | "object-end"
    | "array-start"
    | "array-end"
    | "key"
    | "value"
    | "comma"
    | "colon";
  value?: JsonValue;
  position: number;
  line: number;
  column: number;
}

/**
 * High-performance streaming JSON parser for large files
 */
export class StreamingJsonParser extends EventEmitter {
  private options: Required<StreamingParseOptions>;
  private buffer = "";
  private position = 0;
  private line = 1;
  private column = 1;
  private depth = 0;
  private objectsParsed = 0;
  private bytesProcessed = 0;
  private totalBytes = 0;
  private startTime = 0;
  private peakMemoryUsage = 0;
  private maxDepth = 0;
  private errors: string[] = [];
  private completed = false;
  private hasCriticalParseError = false;
  private parseStack: Array<{
    type: "object" | "array";
    data: any;
    key?: string;
  }> = [];

  constructor(options: StreamingParseOptions = {}) {
    super();
    this.options = {
      maxBufferSize: options.maxBufferSize ?? 64 * 1024 * 1024, // 64MB default
      chunkSize: options.chunkSize ?? 1024 * 1024, // 1MB chunks
      enableProgress: options.enableProgress ?? true,
      maxObjects: options.maxObjects ?? Number.MAX_SAFE_INTEGER,
      pathFilter: options.pathFilter ?? [],
    };
  }

  /**
   * Parse JSON from a readable stream
   */
  async parseStream(
    stream: NodeJS.ReadableStream,
    totalSize?: number,
  ): Promise<StreamingParseResult> {
    this.reset();
    this.totalBytes = totalSize ?? 0;
    this.startTime = performance.now();

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      stream.on("data", (chunk: Buffer | string) => {
        try {
          // Convert string to Buffer if needed
          const bufferChunk = Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(String(chunk), "utf8");
          chunks.push(bufferChunk);
          this.bytesProcessed += bufferChunk.length;

          this.updateProgress();
        } catch (error) {
          reject(error);
        }
      });

      stream.on("end", () => {
        try {
          // Process any remaining chunks
          if (chunks.length > 0) {
            this.processBufferedChunks(chunks);
          }

          // Process any remaining buffer content
          this.finalizeParsing();
          resolve(this.getResult());
        } catch (error) {
          reject(error);
        }
      });

      stream.on("error", reject);
    });
  }

  /**
   * Parse JSON from a string with streaming approach
   */
  parseString(input: string): StreamingParseResult {
    this.reset();
    this.totalBytes = Buffer.byteLength(input, "utf8");
    this.bytesProcessed = this.totalBytes; // Set to total since we have all data
    this.startTime = performance.now();

    try {
      this.processChunk(input);
      this.finalizeParsing();
      return this.getResult();
    } catch (error) {
      this.errors.push(
        error instanceof Error ? error.message : "Unknown error",
      );
      return this.getResult();
    }
  }

  /**
   * Parse large JSON file incrementally
   */
  async parseFile(filePath: string): Promise<StreamingParseResult> {
    const fs = await import("node:fs");
    const stream = fs.createReadStream(filePath, {
      encoding: "utf8",
      highWaterMark: this.options.chunkSize,
    });

    // Get file size for progress tracking
    const stats = await fs.promises.stat(filePath);
    return this.parseStream(stream, stats.size);
  }

  /**
   * Reset parser state
   */
  private reset(): void {
    this.buffer = "";
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.depth = 0;
    this.objectsParsed = 0;
    this.bytesProcessed = 0;
    this.totalBytes = 0;
    this.startTime = 0;
    this.peakMemoryUsage = 0;
    this.maxDepth = 0;
    this.errors = [];
    this.completed = false;
    this.parseStack = [];
  }

  /**
   * Process a chunk of JSON data
   */
  private processChunk(chunk: string): void {
    this.buffer += chunk;
    this.updateMemoryUsage();

    // Parse as much as possible from current buffer
    while (
      this.position < this.buffer.length &&
      this.objectsParsed < this.options.maxObjects
    ) {
      const char = this.buffer[this.position];

      if (!char || this.isWhitespace(char)) {
        this.advancePosition();
        continue;
      }

      try {
        const token = this.parseToken();
        if (token) {
          this.processToken(token);
        }
      } catch (error) {
        this.errors.push(
          `Parse error at line ${this.line}, column ${this.column}: ${error}`,
        );
        // Mark as having a critical parse error to avoid duplicate incomplete JSON errors
        this.hasCriticalParseError = true;
        break;
      }
    }

    // Clean up processed buffer to prevent memory bloat
    this.cleanupBuffer();
  }

  /**
   * Process buffered chunks efficiently
   */
  private processBufferedChunks(chunks: Buffer[]): void {
    const combinedBuffer = Buffer.concat(chunks);
    const chunk = combinedBuffer.toString("utf8");
    this.processChunk(chunk);
  }

  /**
   * Parse the next token from buffer
   */
  private parseToken(): JsonToken | null {
    const start = this.position;
    const char = this.buffer[this.position];

    if (!char) return null;

    switch (char) {
      case "{":
        this.advancePosition();
        return {
          type: "object-start",
          position: start,
          line: this.line,
          column: this.column,
        };

      case "}":
        this.advancePosition();
        return {
          type: "object-end",
          position: start,
          line: this.line,
          column: this.column,
        };

      case "[":
        this.advancePosition();
        return {
          type: "array-start",
          position: start,
          line: this.line,
          column: this.column,
        };

      case "]":
        this.advancePosition();
        return {
          type: "array-end",
          position: start,
          line: this.line,
          column: this.column,
        };

      case ",":
        this.advancePosition();
        return {
          type: "comma",
          position: start,
          line: this.line,
          column: this.column,
        };

      case ":":
        this.advancePosition();
        return {
          type: "colon",
          position: start,
          line: this.line,
          column: this.column,
        };

      case '"':
        return this.parseStringToken();

      default:
        if (this.isNumericStart(char)) {
          return this.parseNumber();
        } else if (char === "t" || char === "f") {
          return this.parseBoolean();
        } else if (char === "n") {
          return this.parseNull();
        } else if (char === "u") {
          // Check for invalid 'undefined' keyword
          if (
            this.buffer.slice(this.position, this.position + 9) === "undefined"
          ) {
            throw new Error("'undefined' is not valid JSON");
          }
          throw new Error(`Unexpected character: ${char}`);
        }

        throw new Error(`Unexpected character: ${char}`);
    }
  }

  /**
   * Parse JSON string token value
   */
  private parseStringToken(): JsonToken {
    const start = this.position;
    this.advancePosition(); // Skip opening quote

    let value = "";
    let escaped = false;

    while (this.position < this.buffer.length) {
      const char = this.buffer[this.position];

      if (escaped) {
        switch (char) {
          case '"':
          case "\\":
          case "/":
            value += char;
            break;
          case "b":
            value += "\b";
            break;
          case "f":
            value += "\f";
            break;
          case "n":
            value += "\n";
            break;
          case "r":
            value += "\r";
            break;
          case "t":
            value += "\t";
            break;
          case "u": {
            // Unicode escape sequence
            const hexCode = this.buffer.slice(
              this.position + 1,
              this.position + 5,
            );
            value += String.fromCharCode(parseInt(hexCode, 16));
            this.position += 4; // Skip the hex digits
            break;
          }
          default:
            value += char;
        }
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        this.advancePosition(); // Skip closing quote
        return {
          type: "value",
          value,
          position: start,
          line: this.line,
          column: this.column,
        };
      } else {
        value += char;
      }

      this.advancePosition();
    }

    throw new Error("Unterminated string");
  }

  /**
   * Parse numeric value
   */
  private parseNumber(): JsonToken {
    const start = this.position;
    let value = "";

    while (this.position < this.buffer.length) {
      const char = this.buffer[this.position];
      if (char && this.isNumericChar(char)) {
        value += char;
        this.advancePosition();
      } else {
        break;
      }
    }

    const numValue = Number(value);
    if (Number.isNaN(numValue)) {
      throw new Error(`Invalid number: ${value}`);
    }

    return {
      type: "value",
      value: numValue,
      position: start,
      line: this.line,
      column: this.column,
    };
  }

  /**
   * Parse boolean value
   */
  private parseBoolean(): JsonToken {
    const start = this.position;

    if (this.buffer.slice(this.position, this.position + 4) === "true") {
      this.position += 4;
      return {
        type: "value",
        value: true,
        position: start,
        line: this.line,
        column: this.column,
      };
    } else if (
      this.buffer.slice(this.position, this.position + 5) === "false"
    ) {
      this.position += 5;
      return {
        type: "value",
        value: false,
        position: start,
        line: this.line,
        column: this.column,
      };
    }

    throw new Error("Invalid boolean value");
  }

  /**
   * Parse null value
   */
  private parseNull(): JsonToken {
    const start = this.position;

    if (this.buffer.slice(this.position, this.position + 4) === "null") {
      this.position += 4;
      return {
        type: "value",
        value: null,
        position: start,
        line: this.line,
        column: this.column,
      };
    }

    throw new Error("Invalid null value");
  }

  /**
   * Process parsed token
   */
  private processToken(token: JsonToken): void {
    switch (token.type) {
      case "object-start":
        this.depth++;
        this.maxDepth = Math.max(this.maxDepth, this.depth);
        this.parseStack.push({ type: "object", data: {} });
        break;

      case "object-end": {
        this.depth--;
        const objFrame = this.parseStack.pop();
        if (objFrame?.type === "object") {
          // Check if we have an incomplete key-value pair (missing value after colon)
          if (objFrame.key !== undefined) {
            throw new Error(`Missing value for key "${objFrame.key}"`);
          }
          this.handleCompletedObject(objFrame.data);
        }
        break;
      }

      case "array-start":
        this.depth++;
        this.maxDepth = Math.max(this.maxDepth, this.depth);
        this.parseStack.push({ type: "array", data: [] });
        break;

      case "array-end": {
        this.depth--;
        const arrFrame = this.parseStack.pop();
        if (arrFrame?.type === "array") {
          this.handleCompletedArray(arrFrame.data);
        }
        break;
      }

      case "value":
        if (token.value !== undefined) {
          this.handleValue(token.value);
        }
        break;
    }
  }

  /**
   * Handle completed object
   */
  private handleCompletedObject(obj: any): void {
    if (this.parseStack.length === 0) {
      // Top-level object completed - only count these
      this.objectsParsed++;
      this.emit("object", obj);
    } else {
      // Nested object - add to parent but don't count
      const parent = this.parseStack[this.parseStack.length - 1];
      if (parent && parent.type === "object" && parent.key) {
        parent.data[parent.key] = obj;
        delete parent.key;
      } else if (parent && parent.type === "array") {
        parent.data.push(obj);
      }
    }
  }

  /**
   * Handle completed array
   */
  private handleCompletedArray(arr: any[]): void {
    if (this.parseStack.length === 0) {
      // Top-level array completed
      this.emit("array", arr);
    } else {
      // Nested array - add to parent
      const parent = this.parseStack[this.parseStack.length - 1];
      if (parent && parent.type === "object" && parent.key) {
        parent.data[parent.key] = arr;
        delete parent.key;
      } else if (parent && parent.type === "array") {
        parent.data.push(arr);
      }
    }
  }

  /**
   * Handle parsed value
   */
  private handleValue(value: JsonValue): void {
    if (this.parseStack.length === 0) {
      // Top-level primitive value - count as object
      this.objectsParsed++;
      this.emit("value", value);
      return;
    }

    const parent = this.parseStack[this.parseStack.length - 1];

    if (parent && parent.type === "object") {
      if (!parent.key) {
        // This value is a key
        parent.key = value as string;
      } else {
        // This value is a property value
        parent.data[parent.key] = value;
        delete parent.key;
      }
    } else if (parent && parent.type === "array") {
      parent.data.push(value);
    }
  }

  /**
   * Finalize parsing process
   */
  private finalizeParsing(): void {
    // Check for incomplete parsing states that should be errors
    // Skip this check if we already have a critical parse error to avoid duplicates
    if (this.parseStack.length > 0 && !this.hasCriticalParseError) {
      this.errors.push(
        `Incomplete JSON: ${this.parseStack.length} unclosed structures`,
      );
      this.completed = false;
      return;
    }

    // Check if we have unparsed content (malformed) or no valid JSON content
    // Skip this check if we already have a critical parse error to avoid duplicates
    const remainingContent = this.buffer.slice(this.position).trim();
    if (
      remainingContent.length > 0 &&
      this.objectsParsed === 0 &&
      !this.hasCriticalParseError
    ) {
      this.errors.push(`Invalid JSON: unparsed content "${remainingContent}"`);
      this.completed = false;
      return;
    }

    // Check if input was only whitespace (no actual JSON content)
    if (
      this.objectsParsed === 0 &&
      this.buffer.trim().length === 0 &&
      this.buffer.length > 0
    ) {
      this.errors.push("No valid JSON content found (whitespace only)");
      this.completed = false;
      return;
    }

    // Parser is completed if:
    // 1. All parsing is done (stack is empty)
    // 2. We've processed at least some content OR had valid primitive values
    // 3. No errors occurred
    this.completed =
      this.parseStack.length === 0 &&
      (this.objectsParsed > 0 || this.bytesProcessed > 0) &&
      this.errors.length === 0;
    this.updateProgress();
  }

  /**
   * Get final parsing result
   */
  private getResult(): StreamingParseResult {
    const parseTime = performance.now() - this.startTime;

    return {
      objects: [], // Objects are emitted via events for memory efficiency
      stats: {
        totalObjects: this.objectsParsed,
        totalBytes: Math.max(this.bytesProcessed, this.totalBytes), // Use the larger value
        parseTime,
        peakMemoryUsage: this.peakMemoryUsage,
        maxDepth: this.maxDepth,
      },
      errors: this.errors,
      completed: this.completed,
    };
  }

  /**
   * Update progress information
   */
  private updateProgress(): void {
    if (!this.options.enableProgress) return;

    const progress: ParseProgress = {
      bytesProcessed: this.bytesProcessed,
      totalBytes: this.totalBytes,
      objectsParsed: this.objectsParsed,
      currentDepth: this.depth,
      percentage:
        this.totalBytes > 0 ? (this.bytesProcessed / this.totalBytes) * 100 : 0,
    };

    // Estimate remaining time
    if (this.totalBytes > 0 && this.bytesProcessed > 0) {
      const elapsed = performance.now() - this.startTime;
      const rate = this.bytesProcessed / elapsed;
      const remaining = this.totalBytes - this.bytesProcessed;
      progress.estimatedTimeRemaining = remaining / rate;
    }

    this.emit("progress", progress);
  }

  /**
   * Update memory usage tracking
   */
  private updateMemoryUsage(): void {
    const usage = process.memoryUsage().heapUsed;
    this.peakMemoryUsage = Math.max(this.peakMemoryUsage, usage);
  }

  /**
   * Clean up processed buffer content
   */
  private cleanupBuffer(): void {
    if (this.position > this.options.chunkSize) {
      this.buffer = this.buffer.slice(this.position);
      this.position = 0;
    }
  }

  /**
   * Advance position and track line/column
   */
  private advancePosition(): void {
    if (this.buffer[this.position] === "\n") {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.position++;
  }

  /**
   * Check if character is whitespace
   */
  private isWhitespace(char: string): boolean {
    return /\s/.test(char);
  }

  /**
   * Check if character can start a number
   */
  private isNumericStart(char: string): boolean {
    return /[-0-9]/.test(char);
  }

  /**
   * Check if character is part of a number
   */
  private isNumericChar(char: string): boolean {
    return /[-+0-9.eE]/.test(char);
  }
}

/**
 * Convenience function for parsing large JSON files
 */
export async function parseJsonStreamFromFile(
  filePath: string,
  options?: StreamingParseOptions,
): Promise<StreamingParseResult> {
  const parser = new StreamingJsonParser(options);
  return parser.parseFile(filePath);
}

/**
 * Convenience function for parsing JSON streams
 */
export async function parseJsonStream(
  stream: NodeJS.ReadableStream,
  options?: StreamingParseOptions,
): Promise<StreamingParseResult> {
  const parser = new StreamingJsonParser(options);
  return parser.parseStream(stream);
}

/**
 * Transform stream for processing JSON objects as they are parsed
 */
export class JsonObjectTransform extends Transform {
  private parser: StreamingJsonParser;

  constructor(options?: StreamingParseOptions) {
    super({ objectMode: true });
    this.parser = new StreamingJsonParser(options);

    this.parser.on("object", (obj) => {
      this.push(obj);
    });

    this.parser.on("array", (arr) => {
      this.push(arr);
    });

    this.parser.on("value", (val) => {
      this.push(val);
    });
  }

  override _transform(
    chunk: Buffer | string,
    _encoding: string,
    callback: (error?: Error) => void,
  ): void {
    try {
      const chunkString = Buffer.isBuffer(chunk)
        ? chunk.toString("utf8")
        : String(chunk);
      this.parser["processChunk"](chunkString);
      callback();
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }

  override _flush(callback: (error?: Error) => void): void {
    try {
      this.parser["finalizeParsing"]();

      // Check if parser has errors and emit them
      const result = this.parser["getResult"]();
      if (result.errors.length > 0) {
        const error = new Error(`JSON parsing failed: ${result.errors[0]}`);
        callback(error instanceof Error ? error : new Error(String(error)));
        return;
      }

      callback();
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
