/**
 * JSON Schema data converter
 */

import type { JsonValue } from "@core/types/index";
import {
  formatJsonSchema,
  inferJsonSchema,
} from "@features/schema/utils/schemaUtils";
import { err, ok } from "neverthrow";
import type {
  ConversionResult,
  DataConverter,
  DataValidationResult,
  SchemaOptions,
} from "./types";

export class SchemaConverter implements DataConverter<SchemaOptions> {
  readonly format = "schema";
  readonly extension = ".json";
  readonly displayName = "JSON Schema";

  convert(
    data: JsonValue,
    options?: SchemaOptions | Record<string, unknown>,
  ): ConversionResult {
    try {
      const finalOptions = { ...this.getDefaultOptions(), ...options };
      const { title = "Exported Schema", baseUrl } = finalOptions;
      const schema = inferJsonSchema(
        data,
        String(title),
        baseUrl ? String(baseUrl) : undefined,
      );
      const result = formatJsonSchema(schema);

      return ok(result);
    } catch (error) {
      return err({
        type: "CONVERSION_ERROR" as const,
        message:
          error instanceof Error ? error.message : "Schema conversion failed",
        format: this.format,
        context: { title: String(options?.title || "Exported Schema") },
      });
    }
  }

  validate(data: JsonValue): DataValidationResult {
    try {
      // Try to infer schema to validate data
      inferJsonSchema(data, "Test Schema");
      return ok(undefined);
    } catch (error) {
      return err({
        type: "VALIDATION_ERROR" as const,
        message:
          error instanceof Error
            ? error.message
            : "Invalid data for schema generation",
        format: this.format,
      });
    }
  }

  getDefaultOptions(): SchemaOptions {
    return {
      title: "Exported Schema",
    };
  }
}
