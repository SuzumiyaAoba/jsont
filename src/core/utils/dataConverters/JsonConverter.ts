/**
 * JSON data converter
 */

import type { JsonValue } from "@core/types/index";
import type {
  ConversionResult,
  DataConverter,
  JsonOptions,
  ValidationResult,
} from "./types";

export class JsonConverter implements DataConverter<JsonOptions> {
  readonly format = "json";
  readonly extension = ".json";
  readonly displayName = "JSON";

  convert(
    data: JsonValue,
    options?: JsonOptions | Record<string, unknown>,
  ): ConversionResult {
    try {
      const finalOptions = { ...this.getDefaultOptions(), ...options };
      const { indent = 2 } = finalOptions;
      const result = JSON.stringify(data, null, Number(indent));

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "JSON conversion failed",
      };
    }
  }

  validate(data: JsonValue): ValidationResult {
    try {
      JSON.stringify(data);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Invalid JSON data",
      };
    }
  }

  getDefaultOptions(): JsonOptions {
    return {
      indent: 2,
    };
  }
}
