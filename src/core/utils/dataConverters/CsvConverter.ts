/**
 * CSV data converter
 */

import type { JsonValue } from "@core/types/index";
import type {
  ConversionResult,
  CsvOptions,
  DataConverter,
  ValidationResult,
} from "./types";

export class CsvConverter implements DataConverter<CsvOptions> {
  readonly format = "csv";
  readonly extension = ".csv";
  readonly displayName = "CSV";

  convert(
    data: JsonValue,
    options?: CsvOptions | Record<string, unknown>,
  ): ConversionResult {
    try {
      const csvOptions = { ...this.getDefaultOptions(), ...options };
      const result = this.convertToCSV(data, csvOptions);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "CSV conversion failed",
      };
    }
  }

  validate(data: JsonValue): ValidationResult {
    if (data === null || data === undefined) {
      return { isValid: true }; // Empty data is valid for CSV
    }

    // CSV works best with array of objects or simple arrays
    if (Array.isArray(data)) {
      return { isValid: true };
    }

    if (typeof data === "object" && data !== null) {
      return { isValid: true };
    }

    if (
      typeof data === "string" ||
      typeof data === "number" ||
      typeof data === "boolean"
    ) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: "Data type not suitable for CSV conversion",
    };
  }

  getDefaultOptions(): CsvOptions {
    return {
      delimiter: ",",
      includeHeaders: true,
      flattenArrays: true,
    };
  }

  private convertToCSV(data: JsonValue, options: CsvOptions): string {
    const { delimiter, includeHeaders, flattenArrays } = options;

    // Handle null or undefined data
    if (data === null || data === undefined) {
      return "";
    }

    // Handle primitive values
    // Primitives are exported as a single column with header "value"
    if (typeof data !== "object") {
      return includeHeaders
        ? `value\n${this.escapeCsvValue(String(data), delimiter)}`
        : String(data);
    }

    // Handle arrays
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return "";
      }

      // If array contains objects, flatten them
      // Each object becomes a row, with all unique keys as columns
      if (typeof data[0] === "object" && data[0] !== null) {
        return this.convertObjectArrayToCSV(
          data as Record<string, unknown>[],
          delimiter,
          includeHeaders,
          flattenArrays,
        );
      }

      // Simple array of primitives
      // Each primitive becomes a row in a single "value" column
      const header = includeHeaders ? "value\n" : "";
      const rows = data
        .map((item) => this.escapeCsvValue(String(item), delimiter))
        .join("\n");
      return header + rows;
    }

    // Handle single object
    if (typeof data === "object" && !Array.isArray(data)) {
      return this.convertObjectArrayToCSV(
        [data as Record<string, unknown>],
        delimiter,
        includeHeaders,
        flattenArrays,
      );
    }

    return "";
  }

  private convertObjectArrayToCSV(
    objects: Record<string, unknown>[],
    delimiter: string,
    includeHeaders: boolean,
    flattenArrays: boolean,
  ): string {
    if (objects.length === 0) {
      return "";
    }

    // Collect all unique keys from all objects
    const allKeys = new Set<string>();
    const flattenedObjects = objects.map((obj) => {
      const flattened = flattenArrays ? this.flattenObject(obj) : obj;
      Object.keys(flattened).forEach((key) => allKeys.add(key));
      return flattened;
    });

    const headers = Array.from(allKeys).sort();

    // Build CSV content
    const lines: string[] = [];

    if (includeHeaders) {
      lines.push(
        headers
          .map((header) => this.escapeCsvValue(header, delimiter))
          .join(delimiter),
      );
    }

    flattenedObjects.forEach((obj) => {
      const row = headers.map((header) => {
        const value = obj[header];
        return this.escapeCsvValue(
          value !== undefined ? String(value) : "",
          delimiter,
        );
      });
      lines.push(row.join(delimiter));
    });

    return lines.join("\n");
  }

  private flattenObject(
    obj: Record<string, unknown>,
    prefix = "",
  ): Record<string, unknown> {
    const flattened: Record<string, unknown> = {};

    Object.entries(obj).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        // Recursively flatten nested objects
        Object.assign(
          flattened,
          this.flattenObject(value as Record<string, unknown>, newKey),
        );
      } else if (Array.isArray(value)) {
        // Convert arrays to semicolon-separated strings
        // Note: Using semicolon to avoid conflicts with comma delimiter
        flattened[newKey] = value
          .map((item) =>
            typeof item === "object" ? JSON.stringify(item) : String(item),
          )
          .join("; ");
      } else {
        flattened[newKey] = value;
      }
    });

    return flattened;
  }

  private escapeCsvValue(value: string, delimiter: string): string {
    // Check if value needs escaping (contains delimiter, quotes, or newlines)
    if (
      value.includes(delimiter) ||
      value.includes('"') ||
      value.includes("\n")
    ) {
      // Escape internal quotes by doubling them
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    return value;
  }
}
