/**
 * File export utilities - Refactored to use data converters
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { JsonValue } from "@core/types/index";
import {
  dataConverterRegistry,
  dataConverters,
} from "@core/utils/dataConverters";
import type { Result } from "@core/utils/errors";
import {
  createExportErrorHandler,
  ExportError,
  ExportErrorCode,
} from "@core/utils/errors";

// Legacy interfaces for backward compatibility
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
 * Export data to various formats using the new converter architecture
 *
 * @param data - The JSON data to export
 * @param options - Export configuration options
 * @returns Promise resolving to export result with success status and file path
 */
export async function exportToFile(
  data: JsonValue,
  options: ExportOptions = {},
): Promise<ExportResult> {
  const errorHandler = createExportErrorHandler();

  try {
    const {
      filename,
      outputDir = process.cwd(),
      format = "json",
      baseUrl,
      csvOptions,
    } = options;

    // Get the appropriate converter
    const converter = dataConverterRegistry.get(format);
    if (!converter) {
      throw new ExportError(
        `Unsupported format: ${format}`,
        ExportErrorCode.UNSUPPORTED_FORMAT,
        { format },
      );
    }

    // Prepare format-specific options
    let converterOptions: Record<string, unknown> = {};
    switch (format) {
      case "schema":
        converterOptions = { title: "Exported Schema", baseUrl };
        break;
      case "csv":
        converterOptions = csvOptions || converter.getDefaultOptions();
        break;
      default:
        converterOptions = converter.getDefaultOptions();
    }

    // Validate data before conversion
    const validation = converter.validate(data);
    if (!validation.isValid) {
      throw new ExportError(
        validation.error || "Data validation failed",
        ExportErrorCode.INVALID_DATA,
        { format, validationError: validation.error },
      );
    }

    // Convert data
    const conversionResult = converter.convert(data, converterOptions);
    if (!conversionResult.success) {
      throw new ExportError(
        conversionResult.error || "Conversion failed",
        ExportErrorCode.CONVERSION_FAILED,
        { format, conversionError: conversionResult.error },
      );
    }

    // Determine final filename
    const extension = converter.extension;
    let defaultFilename = `export${extension}`;
    if (format === "schema") {
      defaultFilename = `schema${extension}`;
    }

    const finalFilename = filename
      ? filename.includes(".")
        ? filename
        : `${filename}${extension}`
      : defaultFilename;

    // Validate filename
    if (!isValidFilename(finalFilename)) {
      throw new ExportError(
        "Invalid filename",
        ExportErrorCode.INVALID_FILENAME,
        { filename: finalFilename },
      );
    }

    // Construct and validate full file path
    const filePath = join(outputDir, finalFilename);

    // Write file
    await writeFile(filePath, conversionResult.data!, "utf8");

    return {
      success: true,
      filePath,
    };
  } catch (error) {
    const exportError = errorHandler.normalize(error, {
      filename: options.filename,
      directory: options.outputDir,
      format: options.format,
      operation: "exportToFile",
    });

    errorHandler.log(exportError);

    return {
      success: false,
      error: exportError.userMessage,
    };
  }
}

/**
 * Validate filename for security and compatibility
 */
function isValidFilename(filename: string): boolean {
  // Check for invalid characters - block only problematic characters
  // Disable biome warning for intentional control character regex
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Control chars intentionally blocked for security
  const invalidChars = /[<>:"|?*\u0000-\u001f]/;
  return !invalidChars.test(filename) && filename.trim().length > 0;
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
