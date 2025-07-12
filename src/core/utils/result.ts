/**
 * Result type utilities using neverthrow for safe error handling
 * Provides type-safe alternatives to throwing exceptions
 */

import { err, ok, type Result } from "neverthrow";
import {
  detectJsonFormat,
  parseJsonSafely as legacyParseJsonSafely,
  parseJsonWithValidation as legacyParseJsonWithValidation,
  validateJsonStructure as legacyValidateJsonStructure,
} from "../../features/json-rendering/utils/jsonProcessor";
import type {
  EnhancedParseResult,
  JsonValue,
  ValidationResult,
} from "../types";

/**
 * Error types for Result-based operations
 */
export type JsonParseError = {
  readonly type: "PARSE_ERROR";
  readonly message: string;
  readonly suggestion?: string | undefined;
  readonly parseTime?: number | undefined;
};

export type JsonValidationError = {
  readonly type: "VALIDATION_ERROR";
  readonly message: string;
  readonly warnings: string[];
};

export type SchemaGenerationError = {
  readonly type: "SCHEMA_ERROR";
  readonly message: string;
  readonly context?: string;
};

export type FileOperationError = {
  readonly type: "FILE_ERROR";
  readonly message: string;
  readonly path?: string;
};

export type AppError =
  | JsonParseError
  | JsonValidationError
  | SchemaGenerationError
  | FileOperationError;

/**
 * Safe JSON parsing with Result type
 */
export function parseJsonSafely(
  input: string,
): Result<JsonValue, JsonParseError> {
  try {
    const parseResult = legacyParseJsonSafely(input);

    if (!parseResult.success) {
      return err({
        type: "PARSE_ERROR" as const,
        message: parseResult.error || "Unknown parsing error",
        suggestion: parseResult.suggestion || undefined,
        parseTime: parseResult.parseTime,
      });
    }

    return ok(parseResult.data);
  } catch (error) {
    return err({
      type: "PARSE_ERROR" as const,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

/**
 * Safe JSON parsing with comprehensive validation
 */
export function parseJsonWithValidation(
  input: string,
): Result<EnhancedParseResult, JsonParseError | JsonValidationError> {
  try {
    const result = legacyParseJsonWithValidation(input);

    if (!result.success) {
      return err({
        type: "PARSE_ERROR" as const,
        message: result.error || "Parse failed",
        suggestion: result.suggestion || undefined,
        parseTime: result.parseTime,
      });
    }

    if (!result.validation.isValid) {
      return err({
        type: "VALIDATION_ERROR" as const,
        message: result.validation.error || "Validation failed",
        warnings: result.validation.warnings || [],
      });
    }

    return ok(result);
  } catch (error) {
    return err({
      type: "PARSE_ERROR" as const,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

/**
 * Safe JSON structure validation
 */
export function validateJsonStructure(
  data: JsonValue,
): Result<ValidationResult, JsonValidationError> {
  try {
    const validation = legacyValidateJsonStructure(data);

    if (!validation.isValid) {
      return err({
        type: "VALIDATION_ERROR" as const,
        message: validation.error || "Validation failed",
        warnings: validation.warnings || [],
      });
    }

    return ok(validation);
  } catch (error) {
    return err({
      type: "VALIDATION_ERROR" as const,
      message:
        error instanceof Error ? error.message : "Validation error occurred",
      warnings: [],
    });
  }
}

/**
 * Safe JSON format detection
 */
export function safeDetectJsonFormat(
  input: string,
): Result<"json" | "json5", JsonParseError> {
  try {
    const format = detectJsonFormat(input);

    if (format === "invalid") {
      return err({
        type: "PARSE_ERROR" as const,
        message: "Invalid JSON format detected",
        suggestion: "Check JSON syntax and structure",
      });
    }

    return ok(format);
  } catch (error) {
    return err({
      type: "PARSE_ERROR" as const,
      message:
        error instanceof Error ? error.message : "Format detection failed",
    });
  }
}

/**
 * Utility function to create error results
 */
export function createError<T extends AppError["type"]>(
  type: T,
  message: string,
  extra?: Partial<Extract<AppError, { type: T }>>,
): Result<never, AppError> {
  return err({
    type,
    message,
    ...extra,
  } as AppError);
}

/**
 * Utility function to handle Result chains safely
 */
export function handleResult<T, E extends AppError>(
  result: Result<T, E>,
  onSuccess: (value: T) => void,
  onError: (error: E) => void,
): void {
  result.match(onSuccess, onError);
}

/**
 * Combine multiple Results into a single Result
 */
export function combineResults<T1, T2, E extends AppError>(
  result1: Result<T1, E>,
  result2: Result<T2, E>,
): Result<[T1, T2], E> {
  return result1.andThen((value1) =>
    result2.map((value2) => [value1, value2] as [T1, T2]),
  );
}

/**
 * Apply a function that might throw to a Result
 */
export function safeAsync<T, E extends AppError>(
  operation: () => Promise<T>,
  errorMapper: (error: unknown) => E,
): Promise<Result<T, E>> {
  return operation()
    .then((value) => ok(value))
    .catch((error) => err(errorMapper(error)));
}

/**
 * Apply a function that might throw to a Result (synchronous)
 */
export function safe<T, E extends AppError>(
  operation: () => T,
  errorMapper: (error: unknown) => E,
): Result<T, E> {
  try {
    return ok(operation());
  } catch (error) {
    return err(errorMapper(error));
  }
}
