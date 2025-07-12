/**
 * File export utilities for JSON Schema
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { JsonValue } from "@core/types/index";
import { formatJsonSchema, inferJsonSchema } from "./schemaUtils";

export interface ExportOptions {
  filename?: string;
  outputDir?: string;
  format?: "json" | "yaml";
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Export JSON Schema to a file
 */
export async function exportJsonSchemaToFile(
  data: JsonValue,
  options: ExportOptions = {},
): Promise<ExportResult> {
  try {
    const {
      filename = "schema.json",
      outputDir = process.cwd(),
      format = "json",
    } = options;

    // Generate JSON Schema
    const schema = inferJsonSchema(data, "Exported Schema");

    // Format content based on format type
    let content: string;
    let finalFilename: string;

    if (format === "yaml") {
      // For now, export as JSON even when YAML is requested
      // Could add yaml library support later
      content = formatJsonSchema(schema);
      finalFilename = filename.replace(/\.(json|yaml|yml)$/, ".json");
    } else {
      content = formatJsonSchema(schema);
      finalFilename = filename.endsWith(".json")
        ? filename
        : `${filename}.json`;
    }

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
 * Generate a safe filename from current timestamp
 */
export function generateDefaultFilename(): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace(/T/, "_")
    .slice(0, 19); // Remove milliseconds and timezone

  return `schema_${timestamp}.json`;
}

/**
 * Validate export options
 */
export function validateExportOptions(options: ExportOptions): {
  isValid: boolean;
  error?: string;
} {
  const { filename, outputDir } = options;

  // Check filename validity (basic check)
  if (filename && !/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return {
      isValid: false,
      error: "Filename contains invalid characters",
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
