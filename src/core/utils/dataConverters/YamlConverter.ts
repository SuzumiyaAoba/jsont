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
import { BaseDataConverter } from "./types";

export class YamlConverter extends BaseDataConverter<YamlOptions> {
  readonly format = "yaml";
  readonly extension = ".yaml";
  readonly displayName = "YAML";

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

  protected performConversion(data: JsonValue, options: YamlOptions): string {
    return yamlDump(data, options);
  }
}
