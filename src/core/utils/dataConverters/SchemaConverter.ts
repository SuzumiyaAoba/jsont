/**
 * JSON Schema data converter
 */

import type { JsonValue } from "@core/types/index";
import { formatJsonSchema, inferJsonSchema } from "@features/schema/utils/schemaUtils";
import type { ConversionResult, DataConverter, SchemaOptions, ValidationResult } from "./types";

export class SchemaConverter implements DataConverter<SchemaOptions> {
  readonly format = "schema";
  readonly extension = ".json";
  readonly displayName = "JSON Schema";

  convert(data: JsonValue, options?: SchemaOptions): ConversionResult {
    try {
      const { title = "Exported Schema", baseUrl } = options || this.getDefaultOptions();
      const schema = inferJsonSchema(data, title, baseUrl);
      const result = formatJsonSchema(schema);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Schema conversion failed",
      };
    }
  }

  validate(data: JsonValue): ValidationResult {
    try {
      // Try to infer schema to validate data
      inferJsonSchema(data, "Test Schema");
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Invalid data for schema generation",
      };
    }
  }

  getDefaultOptions(): SchemaOptions {
    return {
      title: "Exported Schema",
    };
  }
}