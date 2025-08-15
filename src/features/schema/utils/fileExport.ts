/**
 * File export utilities - Refactored to use data converters
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { JsonValue } from "@core/types/index";
import { dataConverterRegistry } from "@core/utils/dataConverters";
import {
  createExportErrorHandler,
  ExportError,
  ExportErrorCode,
} from "@core/utils/errors";

// Legacy interfaces for backward compatibility
export interface ExportOptions {
  filename?: string;
  outputDir?: string;
  format?: "json" | "schema" | "yaml" | "csv" | "xml" | "sql";
  baseUrl?: string;
  csvOptions?: {
    delimiter?: string;
    includeHeaders?: boolean;
    flattenArrays?: boolean;
  };
  xmlOptions?: {
    rootElement?: string;
    arrayItemElement?: string;
    indent?: number;
    declaration?: boolean;
    attributePrefix?: string;
    textNodeName?: string;
  };
  sqlOptions?: {
    tableName?: string;
    dialect?: "mysql" | "postgresql" | "sqlite" | "mssql";
    includeCreateTable?: boolean;
    batchSize?: number;
    escapeIdentifiers?: boolean;
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
      xmlOptions,
      sqlOptions,
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

    // Prepare format-specific options by merging with converter defaults
    const converterOptions = {
      ...converter.getDefaultOptions(),
      ...(format === "schema" && { title: "Exported Schema", baseUrl }),
      ...(format === "csv" && csvOptions),
      ...(format === "xml" && xmlOptions),
      ...(format === "sql" && sqlOptions),
    };

    // Validate data before conversion
    const dataValidation = converter.validate(data);
    if (dataValidation.isErr()) {
      const validationError = dataValidation.error;
      throw new ExportError(
        validationError.message || "Data validation failed",
        ExportErrorCode.INVALID_DATA,
        { format, validationError: validationError.message },
      );
    }

    // Convert data
    const conversionResult = converter.convert(data, converterOptions);
    if (conversionResult.isErr()) {
      const conversionError = conversionResult.error;
      throw new ExportError(
        conversionError.message || "Conversion failed",
        ExportErrorCode.CONVERSION_FAILED,
        { format, conversionError: conversionError.message },
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

    // Validate filename using the existing validation logic
    const optionsValidation = validateExportOptions({
      filename: finalFilename,
      outputDir,
    });
    if (!optionsValidation.isValid) {
      throw new ExportError(
        optionsValidation.error || "Invalid filename",
        ExportErrorCode.INVALID_FILENAME,
        { filename: finalFilename },
      );
    }

    // Construct and validate full file path
    const filePath = join(outputDir, finalFilename);

    // Write file
    await writeFile(filePath, conversionResult.value, "utf8");

    return {
      success: true,
      filePath,
    };
  } catch (error) {
    const exportError = errorHandler.normalize(error, {
      ...(options.filename && { filename: options.filename }),
      ...(options.outputDir && { directory: options.outputDir }),
      ...(options.format && { format: options.format }),
      operation: "exportToFile",
    });

    errorHandler.log(exportError);

    return {
      success: false,
      error: exportError.userMessage,
    };
  }
}

// Note: isValidFilename logic is now consolidated in validateExportOptions

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
  format: "json" | "schema" | "yaml" | "csv" | "xml" | "sql" = "json",
): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace(/T/, "_")
    .slice(0, 19); // Remove milliseconds and timezone

  const extension =
    {
      yaml: ".yaml",
      csv: ".csv",
      xml: ".xml",
      sql: ".sql",
      json: ".json",
      schema: ".json",
    }[format] || ".json";

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
