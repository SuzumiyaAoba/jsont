/**
 * Safe Application service layer with Result-based error handling
 * Provides safe operations for the main App component using neverthrow
 */

import { err, ok, type Result } from "neverthrow";
import type { JsonValue } from "../types";
import type {
  AppError,
  JsonParseError,
  SchemaGenerationError,
} from "../utils/result";
import { parseJsonSafely } from "../utils/result";
import {
  safeFormatJsonSchema,
  safeInferJsonSchema,
} from "../utils/schemaUtils";

export interface AppState {
  data: JsonValue | null;
  error: string | null;
  schemaGenerated: boolean;
}

export interface SchemaViewData {
  schema: string;
  lineCount: number;
}

/**
 * Safely process initial JSON data for the application
 */
export function processInitialData(
  input: string | null,
): Result<JsonValue, JsonParseError> {
  if (!input || input.trim() === "") {
    return err({
      type: "PARSE_ERROR" as const,
      message: "No input data provided",
      suggestion: "Please provide JSON data to display",
    });
  }

  return parseJsonSafely(input);
}

/**
 * Safely generate schema view data from JSON
 */
export function generateSchemaViewData(
  data: JsonValue | null,
  title?: string,
): Result<SchemaViewData, SchemaGenerationError> {
  if (!data) {
    return err({
      type: "SCHEMA_ERROR" as const,
      message: "No data available for schema generation",
      context: "schema view preparation",
    });
  }

  return safeInferJsonSchema(data, title)
    .andThen((schema) =>
      safeFormatJsonSchema(schema).map((formattedSchema) => ({
        schema: formattedSchema,
        lineCount: formattedSchema.split("\n").length,
      })),
    )
    .mapErr((error) => ({
      ...error,
      context: "schema view data generation",
    }));
}

/**
 * Create safe application state from processing results
 */
export function createAppState(
  parseResult: Result<JsonValue, JsonParseError>,
): AppState {
  return parseResult.match(
    (data) => ({
      data,
      error: null,
      schemaGenerated: false,
    }),
    (error) => ({
      data: null,
      error: formatErrorMessage(error),
      schemaGenerated: false,
    }),
  );
}

/**
 * Handle schema generation errors gracefully
 */
export function handleSchemaError(error: SchemaGenerationError): {
  error: string;
  fallback: string;
} {
  const errorMessage = formatErrorMessage(error);
  const fallback = JSON.stringify(
    {
      error: "Schema generation failed",
      reason: error.message,
      context: error.context || "unknown",
    },
    null,
    2,
  );

  return { error: errorMessage, fallback };
}

/**
 * Format error messages for user display
 */
function formatErrorMessage(error: AppError): string {
  switch (error.type) {
    case "PARSE_ERROR":
      return `JSON Parse Error: ${error.message}${
        error.suggestion ? ` (${error.suggestion})` : ""
      }`;
    case "VALIDATION_ERROR":
      return `Validation Error: ${error.message}${
        error.warnings.length > 0
          ? ` (Warnings: ${error.warnings.join(", ")})`
          : ""
      }`;
    case "SCHEMA_ERROR":
      return `Schema Error: ${error.message}${
        error.context ? ` (Context: ${error.context})` : ""
      }`;
    case "FILE_ERROR":
      return `File Error: ${error.message}${
        error.path ? ` (Path: ${error.path})` : ""
      }`;
    default:
      return `Unknown Error: ${(error as { message?: string }).message || "An unexpected error occurred"}`;
  }
}

/**
 * Safely validate application prerequisites
 */
export function validateAppPrerequisites(
  data: JsonValue | null,
  keyboardEnabled: boolean,
): Result<{ valid: true }, AppError> {
  if (data === null) {
    return err({
      type: "VALIDATION_ERROR" as const,
      message: "No data provided to the application",
      warnings: ["Application may not function correctly without data"],
    });
  }

  if (!keyboardEnabled) {
    console.warn(
      "Keyboard navigation is disabled - some features may be limited",
    );
  }

  return ok({ valid: true });
}

/**
 * Create error recovery suggestions
 */
export function getErrorRecoverySuggestions(error: AppError): string[] {
  const suggestions: string[] = [];

  switch (error.type) {
    case "PARSE_ERROR":
      suggestions.push(
        "Check JSON syntax for missing quotes, commas, or brackets",
      );
      suggestions.push("Verify that the input is valid JSON or JSON5 format");
      if (error.suggestion) {
        suggestions.push(error.suggestion);
      }
      break;
    case "VALIDATION_ERROR":
      suggestions.push("Check for circular references in the data");
      suggestions.push(
        "Reduce data complexity if it's too large or deeply nested",
      );
      break;
    case "SCHEMA_ERROR":
      suggestions.push("Try with simpler data to isolate the issue");
      suggestions.push("Check if the data contains unsupported types");
      break;
    case "FILE_ERROR":
      suggestions.push("Verify file permissions and path accessibility");
      suggestions.push("Check if the file exists and is readable");
      break;
  }

  return suggestions;
}

/**
 * Log errors safely without exposing sensitive information
 */
export function logAppError(error: AppError, context?: string): void {
  const logContext = context ? `[${context}]` : "";
  const timestamp = new Date().toISOString();

  console.error(
    `${timestamp} ${logContext} ${error.type}: ${error.message}`,
    error.type === "SCHEMA_ERROR" && error.context
      ? { context: error.context }
      : {},
  );
}
