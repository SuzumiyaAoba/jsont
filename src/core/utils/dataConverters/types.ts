/**
 * Data converter type definitions
 */

import type { JsonValue } from "@core/types/index";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ConversionResult {
  success: boolean;
  data?: string;
  error?: string;
}

export interface DataConverter<TOptions = Record<string, unknown>> {
  readonly format: string;
  readonly extension: string;
  readonly displayName: string;
  
  convert(data: JsonValue, options?: TOptions): ConversionResult;
  validate(data: JsonValue): ValidationResult;
  getDefaultOptions(): TOptions;
}

export interface CsvOptions {
  delimiter: string;
  includeHeaders: boolean;
  flattenArrays: boolean;
}

export interface YamlOptions {
  indent: number;
  lineWidth: number;
  noRefs: boolean;
  skipInvalid: boolean;
}

export interface JsonOptions {
  indent: number;
}

export interface SchemaOptions {
  title: string;
  baseUrl?: string;
}