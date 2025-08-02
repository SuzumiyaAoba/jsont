/**
 * JSON Schema data converter
 */

import type { JsonValue } from "@core/types/index";
import {
  formatJsonSchema,
  inferJsonSchema,
} from "@features/schema/utils/schemaUtils";
import { err, ok } from "neverthrow";
import type { DataValidationResult, SchemaOptions } from "./types";
import { BaseDataConverter } from "./types";

export class SchemaConverter extends BaseDataConverter<SchemaOptions> {
  readonly format = "schema";
  readonly extension = ".json";
  readonly displayName = "JSON Schema";

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

  protected performConversion(data: JsonValue, options: SchemaOptions): string {
    const { title = "Exported Schema", baseUrl } = options;
    const schema = inferJsonSchema(
      data,
      String(title),
      baseUrl ? String(baseUrl) : undefined,
    );
    return formatJsonSchema(schema);
  }
}
