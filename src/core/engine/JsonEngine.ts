/**
 * UI-agnostic JSON processing engine
 * Central orchestrator for all JSON-related operations
 */

import type { JsontConfig } from "@core/config/types";
import type { JsonValue } from "@core/types/index";
import type { SupportedFormat } from "@core/utils/dataConverters";
import { dataConverterRegistry } from "@core/utils/dataConverters";
import { transformWithJq } from "@features/jq/utils/jqTransform";
import {
  parseJsonSafely,
  validateJsonStructure,
} from "@features/json-rendering/utils/jsonProcessor";
import { inferJsonSchema } from "@features/schema/utils/schemaUtils";
import type { SearchScope } from "@features/search/types/search";
import { SearchEngine, type SearchEngineState } from "./SearchEngine";
import { TreeEngine, type TreeEngineState } from "./TreeEngine";

/**
 * JSON processing modes
 */
export type JsonViewMode = "tree" | "raw" | "schema" | "debug";

/**
 * JSON engine state
 */
export interface JsonEngineState {
  /** Current JSON data */
  data: JsonValue | null;
  /** Original raw input */
  rawInput: string;
  /** Current view mode */
  viewMode: JsonViewMode;
  /** Tree engine state */
  tree: TreeEngineState;
  /** Search engine state */
  search: SearchEngineState;
  /** Whether data is valid JSON */
  isValidJson: boolean;
  /** Parse error if any */
  parseError?: string;
  /** JQ transformation state */
  jqQuery: string;
  /** JQ transformation result */
  jqResult?: JsonValue;
  /** JQ error if any */
  jqError?: string;
  /** Configuration */
  config: JsontConfig;
}

/**
 * JSON processing options
 */
export interface JsonProcessingOptions {
  /** Initial view mode */
  viewMode?: JsonViewMode;
  /** Tree display options */
  treeOptions?: {
    expandLevel?: number;
    showSchemaTypes?: boolean;
  };
  /** Search options */
  searchOptions?: {
    caseSensitive?: boolean;
    useRegex?: boolean;
    scope?: SearchScope;
  };
  /** JQ processing options */
  jqOptions?: {
    timeout?: number;
    maxMemory?: number;
  };
}

/**
 * Export options for data conversion
 */
export interface ExportOptions {
  /** Target format */
  format: SupportedFormat;
  /** Format-specific options */
  options?: Record<string, unknown>;
  /** Output filename */
  filename?: string;
}

/**
 * Export result
 */
export interface ExportResult {
  /** Converted data */
  content: string;
  /** Export format */
  format: SupportedFormat;
  /** File extension */
  extension: string;
  /** Export metadata */
  metadata?: {
    size: number;
    generatedAt: Date;
    sourceFormat: string;
  };
}

/**
 * JSON processing commands
 */
export type JsonCommand =
  | "set-view-mode"
  | "parse-json"
  | "apply-jq"
  | "clear-jq"
  | "export-data"
  | "generate-schema"
  | "validate-json"
  | "format-json";

/**
 * Command result
 */
export interface JsonCommandResult {
  /** Whether command was handled */
  handled: boolean;
  /** New engine state */
  state: JsonEngineState;
  /** Command-specific result data */
  result?: unknown;
  /** Error message if command failed */
  error?: string;
}

/**
 * UI-agnostic JSON processing engine
 * Orchestrates all JSON operations without UI dependencies
 */
export class JsonEngine {
  private state: JsonEngineState;
  private treeEngine: TreeEngine;
  private searchEngine: SearchEngine;

  constructor(
    input: string = "",
    config: JsontConfig,
    options: JsonProcessingOptions = {},
  ) {
    // Parse initial JSON
    const parseResult = parseJsonSafely(input);

    this.treeEngine = new TreeEngine(
      parseResult.data,
      options.treeOptions || {},
    );

    this.searchEngine = new SearchEngine(
      parseResult.data,
      options.searchOptions || {},
    );

    this.state = {
      data: parseResult.data,
      rawInput: input,
      viewMode: options.viewMode || "tree",
      tree: this.treeEngine.getState(),
      search: this.searchEngine.getState(),
      isValidJson: parseResult.success,
      jqQuery: "",
      config,
      ...(!parseResult.success &&
        parseResult.error && { parseError: parseResult.error }),
    };
  }

  /**
   * Get current engine state
   */
  getState(): Readonly<JsonEngineState> {
    return {
      ...this.state,
      tree: this.treeEngine.getState(),
      search: this.searchEngine.getState(),
    };
  }

  /**
   * Get tree engine for direct access
   */
  getTreeEngine(): TreeEngine {
    return this.treeEngine;
  }

  /**
   * Get search engine for direct access
   */
  getSearchEngine(): SearchEngine {
    return this.searchEngine;
  }

  /**
   * Execute a JSON processing command
   */
  async executeCommand(
    command: JsonCommand,
    payload?: unknown,
  ): Promise<JsonCommandResult> {
    let handled = false;
    let result: unknown;
    let error: string | undefined;

    try {
      switch (command) {
        case "set-view-mode":
          if (typeof payload === "string" && this.isValidViewMode(payload)) {
            this.state.viewMode = payload as JsonViewMode;
            handled = true;
          }
          break;

        case "parse-json":
          if (typeof payload === "string") {
            result = this.parseJson(payload);
            handled = true;
          }
          break;

        case "apply-jq":
          if (typeof payload === "string") {
            result = await this.applyJqTransformation(payload);
            handled = true;
          }
          break;

        case "clear-jq":
          this.clearJqTransformation();
          handled = true;
          break;

        case "export-data":
          if (payload && typeof payload === "object") {
            result = this.exportData(payload as ExportOptions);
            handled = true;
          }
          break;

        case "generate-schema":
          result = this.generateSchema();
          handled = true;
          break;

        case "validate-json":
          result = this.validateJson();
          handled = true;
          break;

        case "format-json":
          if (typeof payload === "object" && payload !== null) {
            result = this.formatJson(payload as { indent?: number });
            handled = true;
          }
          break;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error occurred";
    }

    return {
      handled,
      state: this.getState(),
      ...(result !== undefined && { result }),
      ...(error !== undefined && { error }),
    };
  }

  /**
   * Parse new JSON input
   */
  private parseJson(input: string): { success: boolean; error?: string } {
    const parseResult = parseJsonSafely(input);

    this.state.rawInput = input;
    this.state.data = parseResult.data;
    this.state.isValidJson = parseResult.success;
    if (!parseResult.success && parseResult.error) {
      this.state.parseError = parseResult.error;
    } else {
      delete this.state.parseError;
    }

    // Update engines with new data
    this.treeEngine.updateData(parseResult.data);
    this.searchEngine.updateData(parseResult.data);

    // Clear JQ transformation
    this.clearJqTransformation();

    return {
      success: parseResult.success,
      ...(parseResult.error && { error: parseResult.error }),
    };
  }

  /**
   * Apply JQ transformation
   */
  private async applyJqTransformation(
    query: string,
  ): Promise<{ success: boolean; result?: JsonValue; error?: string }> {
    this.state.jqQuery = query;

    if (this.state.data === null || this.state.data === undefined) {
      const error = "No JSON data to transform";
      this.state.jqError = error;
      return { success: false, error };
    }

    try {
      const result = await transformWithJq(this.state.data, query);
      if (result.success) {
        this.state.jqResult = result.data as JsonValue;
        delete this.state.jqError;

        // Update engines with transformed data
        this.treeEngine.updateData(result.data as JsonValue);
        this.searchEngine.updateData(result.data as JsonValue);

        return { success: true, result: result.data as JsonValue };
      } else {
        this.state.jqError = result.error || "JQ transformation failed";
        return {
          success: false,
          error: result.error || "JQ transformation failed",
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "JQ transformation failed";
      this.state.jqError = errorMessage;
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Clear JQ transformation
   */
  private clearJqTransformation(): void {
    this.state.jqQuery = "";
    delete this.state.jqResult;
    delete this.state.jqError;

    // Restore original data to engines
    this.treeEngine.updateData(this.state.data);
    this.searchEngine.updateData(this.state.data);
  }

  /**
   * Export data to specified format
   */
  private exportData(options: ExportOptions): ExportResult | { error: string } {
    const dataToExport = this.getCurrentData();

    if (!dataToExport) {
      return { error: "No data to export" };
    }

    const converter = dataConverterRegistry.get(options.format);
    if (!converter) {
      return { error: `Unsupported format: ${options.format}` };
    }

    const conversionResult = converter.convert(dataToExport, options.options);

    if (conversionResult.isErr()) {
      return { error: conversionResult.error.message };
    }

    return {
      content: conversionResult.value,
      format: options.format,
      extension: converter.extension,
      metadata: {
        size: conversionResult.value.length,
        generatedAt: new Date(),
        sourceFormat: "json",
      },
    };
  }

  /**
   * Generate JSON schema
   */
  private generateSchema(): { schema: unknown; error?: string } {
    const dataToAnalyze = this.getCurrentData();

    if (!dataToAnalyze) {
      return { schema: null, error: "No data to analyze" };
    }

    try {
      const schema = inferJsonSchema(dataToAnalyze, "Generated Schema");
      return { schema };
    } catch (error) {
      return {
        schema: null,
        error:
          error instanceof Error ? error.message : "Schema generation failed",
      };
    }
  }

  /**
   * Validate JSON structure
   */
  private validateJson(): {
    isValid: boolean;
    warnings?: string[];
    error?: string;
  } {
    const dataToValidate = this.getCurrentData();

    if (!dataToValidate) {
      return { isValid: false, error: "No data to validate" };
    }

    try {
      const validation = validateJsonStructure(dataToValidate);
      return {
        isValid: validation.isValid,
        ...(validation.warnings && { warnings: validation.warnings }),
        ...(validation.error && { error: validation.error }),
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Validation failed",
      };
    }
  }

  /**
   * Format JSON with options
   */
  private formatJson(options: { indent?: number }): {
    formatted: string;
    error?: string;
  } {
    const dataToFormat = this.getCurrentData();

    if (!dataToFormat) {
      return { formatted: "", error: "No data to format" };
    }

    try {
      const formatted = JSON.stringify(dataToFormat, null, options.indent || 2);
      return { formatted };
    } catch (error) {
      return {
        formatted: "",
        error: error instanceof Error ? error.message : "Formatting failed",
      };
    }
  }

  /**
   * Get current data (JQ result if available, otherwise original)
   */
  private getCurrentData(): JsonValue | null {
    return "jqResult" in this.state ? this.state.jqResult : this.state.data;
  }

  /**
   * Check if view mode is valid
   */
  private isValidViewMode(mode: string): mode is JsonViewMode {
    return ["tree", "raw", "schema", "debug"].includes(mode);
  }
}
