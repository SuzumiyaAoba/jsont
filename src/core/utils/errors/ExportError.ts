/**
 * Standardized export error handling
 */

export enum ExportErrorCode {
  // File system errors
  INVALID_FILENAME = "INVALID_FILENAME",
  DIRECTORY_NOT_ACCESSIBLE = "DIRECTORY_NOT_ACCESSIBLE",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  DISK_SPACE_FULL = "DISK_SPACE_FULL",
  FILE_ALREADY_EXISTS = "FILE_ALREADY_EXISTS",
  
  // Data errors
  INVALID_DATA = "INVALID_DATA",
  CONVERSION_FAILED = "CONVERSION_FAILED",
  UNSUPPORTED_FORMAT = "UNSUPPORTED_FORMAT",
  
  // Configuration errors
  INVALID_OPTIONS = "INVALID_OPTIONS",
  MISSING_REQUIRED_OPTION = "MISSING_REQUIRED_OPTION",
  
  // System errors
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  OPERATION_CANCELLED = "OPERATION_CANCELLED",
}

export interface ExportErrorContext {
  filename?: string;
  directory?: string;
  format?: string;
  operation?: string;
  originalError?: Error;
  [key: string]: unknown;
}

export class ExportError extends Error {
  public readonly code: ExportErrorCode;
  public readonly context: ExportErrorContext;
  public readonly userMessage: string;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ExportErrorCode,
    context: ExportErrorContext = {},
    userMessage?: string,
  ) {
    super(message);
    this.name = "ExportError";
    this.code = code;
    this.context = context;
    this.userMessage = userMessage || this.generateUserMessage();
    this.timestamp = new Date();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExportError);
    }
  }

  private generateUserMessage(): string {
    switch (this.code) {
      case ExportErrorCode.INVALID_FILENAME:
        return "The filename contains invalid characters or is not allowed.";
      case ExportErrorCode.DIRECTORY_NOT_ACCESSIBLE:
        return "The selected directory cannot be accessed. Please choose a different location.";
      case ExportErrorCode.PERMISSION_DENIED:
        return "Permission denied. You don't have permission to write to this location.";
      case ExportErrorCode.DISK_SPACE_FULL:
        return "Not enough disk space to save the file. Please free up space and try again.";
      case ExportErrorCode.FILE_ALREADY_EXISTS:
        return "A file with this name already exists. Please choose a different name.";
      case ExportErrorCode.INVALID_DATA:
        return "The data cannot be exported in the selected format.";
      case ExportErrorCode.CONVERSION_FAILED:
        return "Failed to convert data to the selected format.";
      case ExportErrorCode.UNSUPPORTED_FORMAT:
        return "The selected export format is not supported.";
      case ExportErrorCode.INVALID_OPTIONS:
        return "Invalid export options provided.";
      case ExportErrorCode.MISSING_REQUIRED_OPTION:
        return "A required export option is missing.";
      case ExportErrorCode.OPERATION_CANCELLED:
        return "Export operation was cancelled.";
      default:
        return "An unexpected error occurred during export.";
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      userMessage: this.userMessage,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

export interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  type: "primary" | "secondary";
}

export function createExportErrorHandler() {
  return {
    /**
     * Convert any error to a standardized ExportError
     */
    normalize: (error: unknown, context: ExportErrorContext = {}): ExportError => {
      if (error instanceof ExportError) {
        return error;
      }

      if (error instanceof Error) {
        // Try to classify the error based on the message
        const code = classifyErrorMessage(error.message);
        return new ExportError(
          error.message,
          code,
          { ...context, originalError: error },
        );
      }

      return new ExportError(
        String(error),
        ExportErrorCode.UNKNOWN_ERROR,
        context,
      );
    },

    /**
     * Get recovery actions for a specific error
     */
    getRecoveryActions: (error: ExportError): RecoveryAction[] => {
      const actions: RecoveryAction[] = [];

      switch (error.code) {
        case ExportErrorCode.INVALID_FILENAME:
          actions.push({
            label: "Generate valid filename",
            action: () => {
              // Implementation would depend on the context
            },
            type: "primary",
          });
          break;

        case ExportErrorCode.DIRECTORY_NOT_ACCESSIBLE:
          actions.push({
            label: "Choose different directory",
            action: () => {
              // Implementation would open directory picker
            },
            type: "primary",
          });
          break;

        case ExportErrorCode.PERMISSION_DENIED:
          actions.push({
            label: "Save to Downloads folder",
            action: () => {
              // Implementation would set default directory
            },
            type: "primary",
          });
          break;

        case ExportErrorCode.FILE_ALREADY_EXISTS:
          actions.push({
            label: "Add timestamp to filename",
            action: () => {
              // Implementation would modify filename
            },
            type: "primary",
          });
          actions.push({
            label: "Overwrite existing file",
            action: () => {
              // Implementation would force overwrite
            },
            type: "secondary",
          });
          break;

        case ExportErrorCode.CONVERSION_FAILED:
          actions.push({
            label: "Try different format",
            action: () => {
              // Implementation would suggest alternative format
            },
            type: "primary",
          });
          break;
      }

      // Always add a retry action
      actions.push({
        label: "Retry",
        action: () => {
          // Implementation would retry the operation
        },
        type: "secondary",
      });

      return actions;
    },

    /**
     * Log error for debugging purposes
     */
    log: (error: ExportError): void => {
      console.error("Export Error:", {
        code: error.code,
        message: error.message,
        context: error.context,
        timestamp: error.timestamp,
        stack: error.stack,
      });
    },
  };
}

function classifyErrorMessage(message: string): ExportErrorCode {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("permission") || lowerMessage.includes("access")) {
    return ExportErrorCode.PERMISSION_DENIED;
  }

  if (lowerMessage.includes("space") || lowerMessage.includes("full")) {
    return ExportErrorCode.DISK_SPACE_FULL;
  }

  if (lowerMessage.includes("invalid") && lowerMessage.includes("filename")) {
    return ExportErrorCode.INVALID_FILENAME;
  }

  if (lowerMessage.includes("exists") || lowerMessage.includes("already")) {
    return ExportErrorCode.FILE_ALREADY_EXISTS;
  }

  if (lowerMessage.includes("convert") || lowerMessage.includes("parse")) {
    return ExportErrorCode.CONVERSION_FAILED;
  }

  if (lowerMessage.includes("directory") || lowerMessage.includes("folder")) {
    return ExportErrorCode.DIRECTORY_NOT_ACCESSIBLE;
  }

  return ExportErrorCode.UNKNOWN_ERROR;
}