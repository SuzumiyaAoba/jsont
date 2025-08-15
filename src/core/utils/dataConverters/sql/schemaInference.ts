/**
 * SQL schema inference utilities
 */

import type { JsonValue } from "@core/types/index";
import { isEmpty } from "es-toolkit/compat";
import type { ColumnInfo, TableSchema } from "./types";

/**
 * Infer SQL schema from JSON data
 */
export function inferSchema(
  data: Record<string, JsonValue>[],
  tableName: string,
): TableSchema {
  if (isEmpty(data)) {
    return { tableName, columns: [] };
  }

  // Get all possible column names from all records
  const allKeys = new Set<string>();
  for (const record of data) {
    for (const key of Object.keys(record)) {
      allKeys.add(key);
    }
  }

  // For each column, determine type and nullability
  const columns: ColumnInfo[] = [];
  for (const key of allKeys) {
    const values = data
      .map((record) => record[key])
      .filter((value) => value !== null && value !== undefined);

    const nullable = values.length < data.length;
    const type = inferSqlTypeFromValues(values);

    columns.push({
      name: key,
      type,
      nullable,
    });
  }

  return { tableName, columns };
}

/**
 * Infer SQL type from JSON value
 */
export function inferSqlType(value: JsonValue): string {
  if (value === null || value === undefined) {
    return "TEXT";
  }

  if (typeof value === "boolean") {
    return "BOOLEAN";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? "INTEGER" : "REAL";
  }

  if (typeof value === "string") {
    // Check if it's a date
    if (isDateString(value)) {
      return "TIMESTAMP";
    }
    // Use TEXT type for strings to match original behavior
    return "TEXT";
  }

  if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
    return "TEXT"; // JSON serialized as text
  }

  return "TEXT";
}

/**
 * Infer SQL type from multiple values (for better type detection)
 */
function inferSqlTypeFromValues(values: JsonValue[]): string {
  if (isEmpty(values)) {
    return "TEXT";
  }

  // Check for mixed number types (integer and decimal)
  const numberValues = values.filter((v) => typeof v === "number");
  if (numberValues.length === values.length && numberValues.length > 0) {
    // All values are numbers
    const hasDecimals = numberValues.some((n) => !Number.isInteger(n));
    return hasDecimals ? "REAL" : "INTEGER";
  }

  // Use first value for type detection
  return inferSqlType(values[0] ?? null);
}

/**
 * Check if a string represents a date
 */
function isDateString(str: string): boolean {
  const date = new Date(str);
  return !Number.isNaN(date.getTime()) && str.includes("-");
}

/**
 * Determine if data structure requires multi-table approach
 */
export function shouldUseMultiTableStructure(data: JsonValue): boolean {
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const obj = data as Record<string, JsonValue>;
    // Check if object has nested objects or arrays
    return Object.values(obj).some(
      (value) =>
        Array.isArray(value) || (typeof value === "object" && value !== null),
    );
  }

  if (Array.isArray(data)) {
    // Check if array has objects with different structures
    const objectItems = data.filter(
      (item) =>
        typeof item === "object" && item !== null && !Array.isArray(item),
    ) as Record<string, JsonValue>[];

    if (objectItems.length > 1) {
      const structures = new Set(
        objectItems.map((obj) => Object.keys(obj).sort().join(",")),
      );
      return structures.size > 1;
    }
  }

  return false;
}
