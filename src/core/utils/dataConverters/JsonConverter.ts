/**
 * JSON data converter
 */

import type { JsonValue } from "@core/types/index";
import { err, ok } from "neverthrow";
import type { DataValidationResult, JsonOptions } from "./types";
import { BaseDataConverter } from "./types";

export class JsonConverter extends BaseDataConverter<JsonOptions> {
  readonly format = "json";
  readonly extension = ".json";
  readonly displayName = "JSON";

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

  protected performConversion(data: JsonValue, options: JsonOptions): string {
    const { indent = 2 } = options;
    return JSON.stringify(data, null, Number(indent));
  }
}
