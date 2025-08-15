/**
 * Enhanced JSON Processor with JSON5 support
 * T2.1: JSON基本処理とパース機能
 */

import type {
  EnhancedParseResult,
  JsonStats,
  JsonValue,
  ParseResult,
  ValidationResult,
} from "@core/types/index";
import { isEmpty } from "es-toolkit/compat";
import JSON5 from "json5";

/**
 * Parse JSON/JSON5 safely with enhanced error handling
 */
export function parseJsonSafely(input: string): ParseResult {
  const startTime = performance.now();

  // Handle empty or whitespace-only input
  if (!input || isEmpty(input.trim())) {
    return {
      success: false,
      data: null,
      error: "Input is empty or contains only whitespace",
      suggestion: "Please provide valid JSON data",
      parseTime: performance.now() - startTime,
    };
  }

  try {
    // Try JSON5 first for better compatibility
    const data = JSON5.parse(input);
    const parseTime = performance.now() - startTime;

    return {
      success: true,
      data,
      error: null,
      parseTime,
    };
  } catch (error) {
    const parseTime = performance.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown parsing error";

    // Provide helpful suggestions based on common errors
    let suggestion: string | undefined;

    if (
      errorMessage.includes("Unexpected token") ||
      errorMessage.includes("invalid character")
    ) {
      if (input.includes("'")) {
        suggestion =
          "Use double quotes (\") instead of single quotes (') for strings";
      } else if (input.includes("value") && !input.includes('"value"')) {
        suggestion = "String values must be quoted with double quotes";
      } else {
        suggestion = "Check for missing commas, brackets, or quotes";
      }
    } else if (
      errorMessage.includes("unterminated") ||
      errorMessage.includes("end of input")
    ) {
      suggestion = "Check for unclosed strings, objects, or arrays";
    } else if (errorMessage.includes("trailing comma")) {
      suggestion = "Remove trailing commas or use JSON5 format";
    }

    return {
      success: false,
      data: null,
      error: `JSON parsing failed: ${errorMessage}`,
      suggestion: suggestion ?? undefined,
      parseTime,
    };
  }
}

/**
 * Parse JSON with comprehensive validation
 */
export function parseJsonWithValidation(input: string): EnhancedParseResult {
  const parseResult = parseJsonSafely(input);

  if (!parseResult.success || parseResult.data === null) {
    return {
      ...parseResult,
      validation: {
        isValid: false,
        error: parseResult.error || "Parse failed",
        warnings: [],
      },
    };
  }

  const validation = validateJsonStructure(parseResult.data);

  return {
    ...parseResult,
    validation,
  };
}

/**
 * Validate JSON structure and collect statistics
 */
export function validateJsonStructure(data: JsonValue): ValidationResult {
  try {
    const stats = calculateJsonStats(data);
    const warnings: string[] = [];

    // Check for potential issues
    if (stats.depth > 15) {
      warnings.push("excessive-depth");
    }

    if (stats.size > 1024 * 1024) {
      // > 1MB
      warnings.push("large-size");
    }

    if (stats.keys.length > 1000) {
      warnings.push("many-keys");
    }

    // Check for circular references by attempting to stringify
    try {
      JSON.stringify(data);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes("circular") ||
          error.message.includes("Converting circular")
        ) {
          return {
            isValid: false,
            error: "Circular reference detected in JSON structure",
            suggestion: "Remove circular references before processing",
            warnings: [],
          };
        }
        if (
          error.message.includes("call stack") ||
          error.message.includes("Maximum call stack")
        ) {
          return {
            isValid: false,
            error:
              "Circular reference or excessive nesting detected in JSON structure",
            suggestion: "Remove circular references before processing",
            warnings: [],
          };
        }
      }
    }

    return {
      isValid: true,
      stats,
      warnings: warnings.length > 0 ? warnings : [],
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Validation failed",
      warnings: [],
    };
  }
}

/**
 * Calculate comprehensive JSON statistics
 */
function calculateJsonStats(data: JsonValue): JsonStats {
  const keys = new Set<string>();
  const types: Record<string, number> = {
    string: 0,
    number: 0,
    boolean: 0,
    null: 0,
    object: 0,
    array: 0,
  };

  let maxDepth = 0;

  function traverse(value: JsonValue, currentDepth = 0): void {
    maxDepth = Math.max(maxDepth, currentDepth);

    if (value === null) {
      types["null"] = (types["null"] || 0) + 1;
    } else if (typeof value === "string") {
      types["string"] = (types["string"] || 0) + 1;
    } else if (typeof value === "number") {
      types["number"] = (types["number"] || 0) + 1;
    } else if (typeof value === "boolean") {
      types["boolean"] = (types["boolean"] || 0) + 1;
    } else if (Array.isArray(value)) {
      types["array"] = (types["array"] || 0) + 1;
      value.forEach((item) => traverse(item, currentDepth + 1));
    } else if (typeof value === "object") {
      types["object"] = (types["object"] || 0) + 1;
      Object.entries(value).forEach(([key, val]) => {
        keys.add(key);
        traverse(val, currentDepth + 1);
      });
    }
  }

  traverse(data);

  // Calculate size as JSON string length
  const jsonString = JSON.stringify(data);
  const size = new Blob([jsonString]).size;

  return {
    size,
    depth: maxDepth,
    keys: Array.from(keys).sort(),
    types,
  };
}

/**
 * Format JSON value for display with enhanced options
 */
export function formatJsonValue(
  value: JsonValue,
  options: {
    pretty?: boolean;
    indent?: number;
    colors?: boolean;
    maxLength?: number;
    summary?: boolean; // New option for backward compatibility
  } = {},
): string {
  const {
    pretty = false,
    indent = 2,
    maxLength = 1000,
    summary = true,
  } = options;

  if (value === null) return "null";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value.toString();

  // Summary format for arrays and objects (backward compatibility)
  if (summary) {
    if (Array.isArray(value)) return `[${value.length} items]`;
    if (typeof value === "object") return `{${Object.keys(value).length} keys}`;
  }

  try {
    const jsonString = JSON.stringify(value, null, pretty ? indent : 0);

    // Truncate if too long
    if (maxLength && jsonString.length > maxLength) {
      return `${jsonString.slice(0, maxLength)}... [truncated]`;
    }

    return jsonString;
  } catch (_error) {
    return "[Circular Reference]";
  }
}

/**
 * Detect JSON format type
 */
export function detectJsonFormat(input: string): "json" | "json5" | "invalid" {
  // Quick check for JSON5 features
  const hasJson5Features =
    input.includes("//") || // line comments
    input.includes("/*") || // block comments
    /{\s*\w+\s*:/.test(input) || // unquoted keys
    /,\s*[}\]]/.test(input); // trailing commas

  if (hasJson5Features) {
    try {
      JSON5.parse(input);
      return "json5";
    } catch {
      return "invalid";
    }
  }

  try {
    JSON.parse(input);
    return "json";
  } catch {
    try {
      JSON5.parse(input);
      return "json5";
    } catch {
      return "invalid";
    }
  }
}

/**
 * Repair common JSON issues automatically
 */
export function repairJsonString(input: string): string {
  let repaired = input.trim();

  // Fix common issues
  repaired = repaired
    // Replace single quotes with double quotes for strings
    .replace(/'([^']+)'/g, '"$1"')
    // Add quotes around unquoted keys (simple cases)
    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
    // Remove trailing commas
    .replace(/,(\s*[}\]])/g, "$1");

  return repaired;
}

/**
 * Extract JSON from mixed content (e.g., code blocks)
 */
export function extractJsonFromText(text: string): string[] {
  const jsonBlocks: string[] = [];

  // Look for JSON in code blocks
  const codeBlockRegex = /```(?:json|json5)?\s*([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  match = codeBlockRegex.exec(text);
  while (match !== null) {
    jsonBlocks.push(match[1]?.trim() ?? "");
    match = codeBlockRegex.exec(text);
  }

  // Look for standalone JSON objects/arrays
  const jsonRegex = /[{[][\s\S]*?[}\]]/g;
  match = jsonRegex.exec(text);
  while (match !== null) {
    const candidate = match[0];
    if (detectJsonFormat(candidate) !== "invalid") {
      jsonBlocks.push(candidate);
    }
    match = jsonRegex.exec(text);
  }

  return jsonBlocks;
}
