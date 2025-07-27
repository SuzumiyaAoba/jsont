/**
 * Data converter type definitions
 */

import type { JsonValue } from "@core/types/index";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export type ConversionResult =
  | { success: true; data: string }
  | { success: false; error: string };

export interface DataConverter<TOptions = Record<string, unknown>> {
  readonly format: string;
  readonly extension: string;
  readonly displayName: string;

  convert(
    data: JsonValue,
    options?: TOptions | Record<string, unknown>,
  ): ConversionResult;
  validate(data: JsonValue): ValidationResult;
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
