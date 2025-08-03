/**
 * Data converter type definitions
 */

import type { JsonValue } from "@core/types/index";
import { err, ok, type Result } from "neverthrow";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// neverthrow Result types for data conversion
export type ConversionError = {
  readonly type: "CONVERSION_ERROR";
  readonly message: string;
  readonly format?: string;
  readonly context?: Record<string, unknown>;
};

export type ValidationError = {
  readonly type: "VALIDATION_ERROR";
  readonly message: string;
  readonly format?: string;
};

export type ConversionResult = Result<string, ConversionError>;
export type DataValidationResult = Result<void, ValidationError>;

export interface DataConverter<TOptions = Record<string, unknown>> {
  readonly format: string;
  readonly extension: string;
  readonly displayName: string;

  convert(
    data: JsonValue,
    options?: TOptions | Record<string, unknown>,
  ): ConversionResult;
  validate(data: JsonValue): DataValidationResult;
  getDefaultOptions(): TOptions;
}

/**
 * Abstract base class for data converters
 * Provides common functionality and error handling patterns
 */
export abstract class BaseDataConverter<TOptions = Record<string, unknown>>
  implements DataConverter<TOptions>
{
  abstract readonly format: string;
  abstract readonly extension: string;
  abstract readonly displayName: string;

  /**
   * Convert data with standardized error handling
   */
  convert(
    data: JsonValue,
    options?: TOptions | Record<string, unknown>,
  ): ConversionResult {
    try {
      const mergedOptions = this.mergeWithDefaults(options);
      const result = this.performConversion(data, mergedOptions);
      return ok(result);
    } catch (error) {
      return err({
        type: "CONVERSION_ERROR" as const,
        message:
          error instanceof Error
            ? error.message
            : `${this.displayName} conversion failed`,
        format: this.format,
        context: { options },
      });
    }
  }

  /**
   * Merge provided options with defaults
   */
  protected mergeWithDefaults(
    options?: TOptions | Record<string, unknown>,
  ): TOptions {
    return { ...this.getDefaultOptions(), ...options } as TOptions;
  }

  /**
   * Abstract method for format-specific conversion logic
   * Implementations should focus on conversion without error handling
   */
  protected abstract performConversion(
    data: JsonValue,
    options: TOptions,
  ): string;

  /**
   * Abstract methods that must be implemented by subclasses
   */
  abstract validate(data: JsonValue): DataValidationResult;
  abstract getDefaultOptions(): TOptions;
}

export interface CsvOptions extends Record<string, unknown> {
  delimiter: string;
  includeHeaders: boolean;
  flattenArrays: boolean;
}

export interface YamlOptions extends Record<string, unknown> {
  indent: number;
  lineWidth: number;
  noRefs: boolean;
  skipInvalid: boolean;
}

export interface JsonOptions extends Record<string, unknown> {
  indent: number;
}

export interface SchemaOptions extends Record<string, unknown> {
  title: string;
  baseUrl?: string;
}

export interface XmlOptions extends Record<string, unknown> {
  rootElement: string;
  arrayItemElement: string;
  indent: number;
  declaration: boolean;
  attributePrefix: string;
  textNodeName: string;
}

export interface SqlOptions extends Record<string, unknown> {
  tableName: string;
  dialect: "mysql" | "postgresql" | "sqlite" | "mssql";
  includeCreateTable: boolean;
  batchSize: number;
  escapeIdentifiers: boolean;
  useMultiTableStructure?: boolean;
}
