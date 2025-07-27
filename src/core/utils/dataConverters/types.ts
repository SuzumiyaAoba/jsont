/**
 * Data converter type definitions
 */

import type { JsonValue } from "@core/types/index";
import type { Result } from "neverthrow";

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
}
