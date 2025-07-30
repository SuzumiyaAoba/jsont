/**
 * SQL value formatting utilities
 */

import type { JsonValue } from "@core/types/index";

/**
 * Format a value for SQL insertion
 */
export function formatSqlValue(
  value: JsonValue,
  dialect = "postgresql",
): string {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (typeof value === "boolean") {
    // Handle dialect-specific boolean formatting
    switch (dialect) {
      case "mysql":
        return value ? "TRUE" : "FALSE";
      case "sqlite":
        return value ? "1" : "0";
      case "mssql":
      case "sqlserver":
        return value ? "1" : "0";
      default:
        return value ? "true" : "false";
    }
  }

  if (typeof value === "number") {
    return value.toString();
  }

  if (typeof value === "string") {
    return `'${escapeSqlString(value, dialect)}'`;
  }

  // For objects and arrays, convert to JSON string
  if (typeof value === "object") {
    return `'${escapeSqlString(JSON.stringify(value), dialect)}'`;
  }

  return `'${escapeSqlString(String(value), dialect)}'`;
}

/**
 * Escape SQL string literals for different dialects
 */
export function escapeSqlString(str: string, dialect = "postgresql"): string {
  switch (dialect) {
    case "mysql":
      return str.replace(/'/g, "\\'").replace(/\\/g, "\\\\");
    default:
      return str.replace(/'/g, "''");
  }
}
