/**
 * YAML data converter
 */

import type { JsonValue } from "@core/types/index";
import { dump as yamlDump } from "js-yaml";
import { err, ok } from "neverthrow";
import type {
  ConversionResult,
  DataConverter,
  DataValidationResult,
  YamlOptions,
} from "./types";

export class YamlConverter implements DataConverter<YamlOptions> {
  readonly format = "yaml";
  readonly extension = ".yaml";
  readonly displayName = "YAML";

  convert(
    data: JsonValue,
    options?: YamlOptions | Record<string, unknown>,
  ): ConversionResult {
    try {
      const yamlOptions = { ...this.getDefaultOptions(), ...options };
      const result = yamlDump(data, yamlOptions);

      return ok(result);
    } catch (error) {
      return err({
        type: "CONVERSION_ERROR" as const,
        message:
          error instanceof Error ? error.message : "YAML conversion failed",
        format: this.format,
      });
    }
  }

  validate(data: JsonValue): DataValidationResult {
    try {
      yamlDump(data);
      return ok(undefined);
    } catch (error) {
      return err({
        type: "VALIDATION_ERROR" as const,
        message:
          error instanceof Error
            ? error.message
            : "Invalid data for YAML conversion",
        format: this.format,
      });
    }
  }

  getDefaultOptions(): YamlOptions {
    return {
      indent: 2,
      lineWidth: -1, // No line wrapping
      noRefs: true, // Avoid references
      skipInvalid: true, // Skip invalid values
    };
  }
}
