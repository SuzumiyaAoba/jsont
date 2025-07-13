/**
 * File export utilities for JSON and JSON Schema
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { JsonValue } from "@core/types/index";
import { formatJsonSchema, inferJsonSchema } from "./schemaUtils";

export interface ExportOptions {
  filename?: string;
  outputDir?: string;
  format?: "json" | "schema";
  baseUrl?: string;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Export JSON or JSON Schema to a file
 *
 * @param data - The JSON data to export
 * @param options - Export configuration options
 * @param options.filename - Output filename (defaults to "export.json")
 * @param options.outputDir - Output directory (defaults to current working directory)
 * @param options.format - Export format: "json" for data, "schema" for JSON Schema (defaults to "json")
 * @param options.baseUrl - Base URL for JSON Schema (only used when format is "schema")
 * @returns Promise resolving to export result with success status and file path
 */
export async function exportToFile(
  data: JsonValue,
  options: ExportOptions = {},
): Promise<ExportResult> {
  try {
    const {
      filename = "export.json",
      outputDir = process.cwd(),
      format = "json",
      baseUrl,
    } = options;

    const content =
      format === "schema"
        ? formatJsonSchema(inferJsonSchema(data, "Exported Schema", baseUrl))
        : JSON.stringify(data, null, 2);

    const finalFilename = filename.endsWith(".json")
      ? filename
      : `${filename}.json`;

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
 * @returns Generated filename with timestamp
 */
export function generateDefaultFilename(): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace(/T/, "_")
    .slice(0, 19); // Remove milliseconds and timezone

  return `export_${timestamp}.json`;
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
