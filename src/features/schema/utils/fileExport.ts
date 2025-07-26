/**
 * File export utilities for JSON, JSON Schema, YAML, and CSV
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { JsonValue } from "@core/types/index";
import { dump as yamlDump } from "js-yaml";
import { formatJsonSchema, inferJsonSchema } from "./schemaUtils";

export interface ExportOptions {
  filename?: string;
  outputDir?: string;
  format?: "json" | "schema" | "yaml" | "csv";
  baseUrl?: string;
  csvOptions?: {
    delimiter?: string;
    includeHeaders?: boolean;
    flattenArrays?: boolean;
  };
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Export data to various formats
 *
 * @param data - The JSON data to export
 * @param options - Export configuration options
 * @param options.filename - Output filename (defaults based on format)
 * @param options.outputDir - Output directory (defaults to current working directory)
 * @param options.format - Export format: "json", "schema", "yaml", or "csv" (defaults to "json")
 * @param options.baseUrl - Base URL for JSON Schema (only used when format is "schema")
 * @param options.csvOptions - CSV-specific options (delimiter, headers, array flattening)
 * @returns Promise resolving to export result with success status and file path
 */
export async function exportToFile(
  data: JsonValue,
  options: ExportOptions = {},
): Promise<ExportResult> {
  try {
    const {
      filename,
      outputDir = process.cwd(),
      format = "json",
      baseUrl,
      csvOptions,
    } = options;

    // Generate content based on format
    let content: string;
    let defaultExtension: string;
    let defaultFilename: string;

    switch (format) {
      case "schema":
        content = formatJsonSchema(
          inferJsonSchema(data, "Exported Schema", baseUrl),
        );
        defaultExtension = ".json";
        defaultFilename = "schema.json";
        break;
      case "yaml":
        content = yamlDump(data, {
          indent: 2,
          lineWidth: -1, // No line wrapping
          noRefs: true, // Avoid references
          skipInvalid: true, // Skip invalid values
        });
        defaultExtension = ".yaml";
        defaultFilename = "export.yaml";
        break;
      case "csv":
        content = convertToCSV(data, csvOptions);
        defaultExtension = ".csv";
        defaultFilename = "export.csv";
        break;
      case "json":
      default:
        content = JSON.stringify(data, null, 2);
        defaultExtension = ".json";
        defaultFilename = "export.json";
        break;
    }

    // Determine final filename
    const finalFilename = filename
      ? filename.includes(".")
        ? filename
        : `${filename}${defaultExtension}`
      : defaultFilename;

    // Construct full file path
    const filePath = join(outputDir, finalFilename);
    // Write file
    await writeFile(filePath, content, "utf8");

    return {
      success: true,
      filePath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown export error",
    };
  }
}

/**
 * Export JSON Schema to a file (backward compatibility)
 * @deprecated Use exportToFile with format: "schema" instead
 */
export async function exportJsonSchemaToFile(
  data: JsonValue,
  options: ExportOptions = {},
): Promise<ExportResult> {
  return exportToFile(data, { ...options, format: "schema" });
}

/**
 * Generate a safe filename from current timestamp
 *
 * @param format - Export format to determine file extension
 * @returns Generated filename with timestamp
 */
export function generateDefaultFilename(
  format: "json" | "schema" | "yaml" | "csv" = "json",
): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace(/T/, "_")
    .slice(0, 19); // Remove milliseconds and timezone

  const extension =
    format === "yaml" ? ".yaml" : format === "csv" ? ".csv" : ".json";
  return `export_${timestamp}${extension}`;
}

/**
 * Validate export options
 */
export function validateExportOptions(options: ExportOptions): {
  isValid: boolean;
  error?: string;
} {
  const { filename, outputDir } = options;

  // Check filename validity - block only problematic characters
  // Disable biome warning for intentional control character regex
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Control chars intentionally blocked for security
  if (filename && /[<>:"|?*\u0000-\u001f]/.test(filename)) {
    return {
      isValid: false,
      error:
        'Filename contains forbidden characters (<>:"|?* or control chars)',
    };
  }

  // Check if output directory is accessible (we'll do this when actually writing)
  if (outputDir?.includes("..")) {
    return {
      isValid: false,
      error: "Output directory cannot contain '..' for security reasons",
    };
  }

  return { isValid: true };
}

/**
 * Convert JSON data to CSV format
 *
 * @param data - JSON data to convert
 * @param options - CSV conversion options
 * @returns CSV string representation
 */
function convertToCSV(
  data: JsonValue,
  options: ExportOptions["csvOptions"] = {},
): string {
  const {
    delimiter = ",",
    includeHeaders = true,
    flattenArrays = true,
  } = options;

  // Handle null or undefined data
  if (data === null || data === undefined) {
    return "";
  }

  // Handle primitive values
  // Primitives are exported as a single column with header "value"
  if (typeof data !== "object") {
    return includeHeaders
      ? `value\n${escapeCsvValue(String(data), delimiter)}`
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
      return convertObjectArrayToCSV(
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
      .map((item) => escapeCsvValue(String(item), delimiter))
      .join("\n");
    return header + rows;
  }

  // Handle single object
  if (typeof data === "object" && !Array.isArray(data)) {
    return convertObjectArrayToCSV(
      [data as Record<string, unknown>],
      delimiter,
      includeHeaders,
      flattenArrays,
    );
  }

  return "";
}

/**
 * Convert array of objects to CSV
 */
function convertObjectArrayToCSV(
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
    const flattened = flattenArrays ? flattenObject(obj) : obj;
    Object.keys(flattened).forEach((key) => allKeys.add(key));
    return flattened;
  });

  const headers = Array.from(allKeys).sort();

  // Build CSV content
  const lines: string[] = [];

  if (includeHeaders) {
    lines.push(
      headers
        .map((header) => escapeCsvValue(header, delimiter))
        .join(delimiter),
    );
  }

  flattenedObjects.forEach((obj) => {
    const row = headers.map((header) => {
      const value = obj[header];
      return escapeCsvValue(
        value !== undefined ? String(value) : "",
        delimiter,
      );
    });
    lines.push(row.join(delimiter));
  });

  return lines.join("\n");
}

/**
 * Flatten nested object for CSV conversion
 */
function flattenObject(
  obj: Record<string, unknown>,
  prefix = "",
): Record<string, unknown> {
  const flattened: Record<string, unknown> = {};

  Object.entries(obj).forEach(([key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      // Recursively flatten nested objects
      Object.assign(
        flattened,
        flattenObject(value as Record<string, unknown>, newKey),
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

/**
 * Escape CSV value by adding quotes and escaping internal quotes
 */
function escapeCsvValue(value: string, delimiter: string): string {
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
