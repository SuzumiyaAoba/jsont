/**
 * YAML data converter
 */

import type { JsonValue } from "@core/types/index";
import { dump as yamlDump } from "js-yaml";
import type { ConversionResult, DataConverter, ValidationResult, YamlOptions } from "./types";

export class YamlConverter implements DataConverter<YamlOptions> {
  readonly format = "yaml";
  readonly extension = ".yaml";
  readonly displayName = "YAML";

  convert(data: JsonValue, options?: YamlOptions): ConversionResult {
    try {
      const yamlOptions = { ...this.getDefaultOptions(), ...options };
      const result = yamlDump(data, yamlOptions);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "YAML conversion failed",
      };
    }
  }

  validate(data: JsonValue): ValidationResult {
    try {
      yamlDump(data);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Invalid data for YAML conversion",
      };
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