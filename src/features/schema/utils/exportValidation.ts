/**
 * Comprehensive export validation utilities
 */

import { homedir } from "node:os";
import { join, resolve } from "node:path";
import type { ExportConfiguration, ValidationError, ValidationResult, ValidationWarning } from "../types/strictExport";

export class ExportValidator {
  private static readonly INVALID_FILENAME_CHARS = /[<>:"|?*\u0000-\u001f]/;
  private static readonly RESERVED_NAMES = [
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
  ];

  static validate(config: ExportConfiguration): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate filename
    const filenameValidation = this.validateFilename(config.filename);
    errors.push(...filenameValidation.errors);
    warnings.push(...filenameValidation.warnings);

    // Validate directory
    const directoryValidation = this.validateDirectory(config.outputDir);
    errors.push(...directoryValidation.errors);
    warnings.push(...directoryValidation.warnings);

    // Validate format-specific options
    const optionsValidation = this.validateFormatOptions(config);
    errors.push(...optionsValidation.errors);
    warnings.push(...optionsValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private static validateFilename(filename: string): Pick<ValidationResult, "errors" | "warnings"> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!filename || filename.trim().length === 0) {
      errors.push({
        field: "filename",
        message: "Filename is required",
        code: "FILENAME_REQUIRED",
      });
      return { errors, warnings };
    }

    const trimmedFilename = filename.trim();

    // Check for invalid characters
    if (this.INVALID_FILENAME_CHARS.test(trimmedFilename)) {
      errors.push({
        field: "filename",
        message: "Filename contains invalid characters",
        code: "INVALID_FILENAME_CHARS",
      });
    }

    // Check for reserved names (Windows)
    const nameWithoutExtension = trimmedFilename.split(".")[0]?.toUpperCase();
    if (nameWithoutExtension && this.RESERVED_NAMES.includes(nameWithoutExtension)) {
      errors.push({
        field: "filename",
        message: "Filename uses a reserved system name",
        code: "RESERVED_FILENAME",
      });
    }

    // Check length
    if (trimmedFilename.length > 255) {
      errors.push({
        field: "filename",
        message: "Filename is too long (maximum 255 characters)",
        code: "FILENAME_TOO_LONG",
      });
    }

    // Warnings
    if (trimmedFilename.startsWith(".")) {
      warnings.push({
        field: "filename",
        message: "Filename starts with a dot (hidden file)",
        suggestion: "Consider using a visible filename",
      });
    }

    if (trimmedFilename.includes(" ")) {
      warnings.push({
        field: "filename",
        message: "Filename contains spaces",
        suggestion: "Consider using underscores or hyphens instead",
      });
    }

    return { errors, warnings };
  }

  private static validateDirectory(directory: string): Pick<ValidationResult, "errors" | "warnings"> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!directory || directory.trim().length === 0) {
      errors.push({
        field: "outputDir",
        message: "Output directory is required",
        code: "DIRECTORY_REQUIRED",
      });
      return { errors, warnings };
    }

    const trimmedDirectory = directory.trim();

    // Check for directory traversal
    if (trimmedDirectory.includes("..")) {
      errors.push({
        field: "outputDir",
        message: "Directory path cannot contain '..' for security reasons",
        code: "DIRECTORY_TRAVERSAL",
      });
    }

    // Resolve and validate path
    try {
      const resolvedPath = resolve(trimmedDirectory);
      
      // Check if it's trying to access system directories
      const systemDirs = ["/etc", "/bin", "/sbin", "/usr/bin", "/usr/sbin"];
      if (systemDirs.some(dir => resolvedPath.startsWith(dir))) {
        warnings.push({
          field: "outputDir",
          message: "Writing to system directories is not recommended",
          suggestion: "Consider using Documents or Downloads folder",
        });
      }

      // Check if it's the home directory
      if (resolvedPath === homedir()) {
        warnings.push({
          field: "outputDir",
          message: "Writing directly to home directory",
          suggestion: "Consider using a subdirectory like Documents",
        });
      }

    } catch (error) {
      errors.push({
        field: "outputDir",
        message: "Invalid directory path",
        code: "INVALID_DIRECTORY_PATH",
      });
    }

    return { errors, warnings };
  }

  private static validateFormatOptions(config: ExportConfiguration): Pick<ValidationResult, "errors" | "warnings"> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    switch (config.format) {
      case "csv":
        if (config.csvOptions) {
          if (!config.csvOptions.delimiter || config.csvOptions.delimiter.length === 0) {
            errors.push({
              field: "csvOptions",
              message: "CSV delimiter cannot be empty",
              code: "INVALID_CSV_DELIMITER",
            });
          }

          if (config.csvOptions.delimiter.length > 1) {
            warnings.push({
              field: "csvOptions",
              message: "Multi-character delimiter may not be supported by all applications",
              suggestion: "Consider using single character delimiters like ',' or ';'",
            });
          }
        }
        break;

      case "schema":
        if (config.schemaOptions) {
          if (!config.schemaOptions.title || config.schemaOptions.title.trim().length === 0) {
            warnings.push({
              field: "schemaOptions",
              message: "Schema title is empty",
              suggestion: "Consider providing a descriptive title",
            });
          }

          if (config.schemaOptions.baseUrl && !this.isValidUrl(config.schemaOptions.baseUrl)) {
            errors.push({
              field: "schemaOptions",
              message: "Invalid base URL format",
              code: "INVALID_BASE_URL",
            });
          }
        }
        break;

      case "yaml":
        if (config.yamlOptions) {
          if (config.yamlOptions.indent < 1 || config.yamlOptions.indent > 10) {
            warnings.push({
              field: "yamlOptions",
              message: "YAML indent should be between 1 and 10 spaces",
              suggestion: "Consider using 2 or 4 spaces for better readability",
            });
          }
        }
        break;

      case "json":
        if (config.jsonOptions) {
          if (config.jsonOptions.indent < 0 || config.jsonOptions.indent > 10) {
            warnings.push({
              field: "jsonOptions",
              message: "JSON indent should be between 0 and 10 spaces",
              suggestion: "Consider using 2 or 4 spaces for better readability",
            });
          }
        }
        break;
    }

    return { errors, warnings };
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Validation helpers for specific use cases
  static validateQuickAccess(directory: string): boolean {
    const commonDirs = [
      process.cwd(),
      homedir(),
      join(homedir(), "Desktop"),
      join(homedir(), "Documents"),
      join(homedir(), "Downloads"),
    ];

    return commonDirs.includes(directory);
  }

  static sanitizeFilename(filename: string): string {
    return filename
      .replace(this.INVALID_FILENAME_CHARS, "_")
      .replace(/^\.+/, "") // Remove leading dots
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .substring(0, 255); // Truncate to max length
  }

  static generateSafeFilename(baseName: string, extension: string): string {
    const sanitized = this.sanitizeFilename(baseName);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    return `${sanitized}_${timestamp}${extension}`;
  }
}