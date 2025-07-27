/**
 * JSON data converter
 */

import type { JsonValue } from "@core/types/index";
import { err, ok } from "neverthrow";
import type {
  ConversionResult,
  DataConverter,
  DataValidationResult,
  JsonOptions,
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

      return ok(result);
    } catch (error) {
      return err({
        type: "CONVERSION_ERROR" as const,
        message:
          error instanceof Error ? error.message : "JSON conversion failed",
        format: this.format,
      });
    }
  }

  validate(data: JsonValue): DataValidationResult {
    try {
      JSON.stringify(data);
      return ok(undefined);
    } catch (error) {
      return err({
        type: "VALIDATION_ERROR" as const,
        message: error instanceof Error ? error.message : "Invalid JSON data",
        format: this.format,
      });
    }
  }

  getDefaultOptions(): JsonOptions {
    return {
      indent: 2,
    };
  }
}
