/**
 * SQL data transformation utilities
 */

import type { JsonValue } from "@core/types/index";
import { inferSchema } from "./schemaInference";
import type { TableStructure } from "./types";

/**
 * Normalize JSON data for SQL conversion
 */
export function normalizeDataForSQL(
  data: JsonValue,
): Record<string, JsonValue>[] {
  if (Array.isArray(data)) {
    return data.map((item, index) => {
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        return item as Record<string, JsonValue>;
      }
      return { [`item_${index}`]: item };
    });
  }

  if (typeof data === "object" && data !== null) {
    return [data as Record<string, JsonValue>];
  }

  // For primitives, create a single-column table
  return [{ value: data }];
}

/**
 * Extract table structures from JSON data, creating separate tables for different object types
 */
export function extractTableStructures(
  data: JsonValue,
  baseTableName: string,
): TableStructure[] {
  const structures: TableStructure[] = [];

  if (Array.isArray(data)) {
    // Group array items by their structure (object keys)
    const groupedByStructure = groupByObjectStructure(data);

    let tableIndex = 0;
    for (const [, items] of groupedByStructure.entries()) {
      const tableName =
        groupedByStructure.size > 1
          ? `${baseTableName}_${tableIndex}`
          : baseTableName;

      const schema = inferSchema(items, tableName);
      structures.push({
        schema,
        data: items,
      });

      tableIndex++;
    }
  } else if (typeof data === "object" && data !== null) {
    // Single object - analyze nested objects
    const flattenedStructures = flattenObjectToTables(data, baseTableName);
    structures.push(...flattenedStructures);
  } else {
    // Primitive value - create single table
    const primitiveData = [{ value: data }];
    const schema = inferSchema(primitiveData, baseTableName);
    structures.push({
      schema,
      data: primitiveData,
    });
  }

  return structures;
}

/**
 * Group array items by their object structure (set of keys)
 */
function groupByObjectStructure(
  array: JsonValue[],
): Map<string, Record<string, JsonValue>[]> {
  const groups = new Map<string, Record<string, JsonValue>[]>();

  for (const item of array) {
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      const obj = item as Record<string, JsonValue>;
      const structure = Object.keys(obj).sort().join(",");

      if (!groups.has(structure)) {
        groups.set(structure, []);
      }
      groups.get(structure)!.push(obj);
    } else {
      // Non-object items get their own structure
      const structure = `primitive_${typeof item}`;
      if (!groups.has(structure)) {
        groups.set(structure, []);
      }
      groups.get(structure)!.push({ value: item });
    }
  }

  return groups;
}

/**
 * Flatten nested object into multiple table structures
 */
function flattenObjectToTables(
  obj: Record<string, JsonValue>,
  baseTableName: string,
): TableStructure[] {
  const structures: TableStructure[] = [];
  const mainTableData: Record<string, JsonValue> = {};
  const nestedTableIndex = 0;

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      // Create separate table for array
      const nestedTableName = `${baseTableName}_${key}`;
      const arrayStructures = extractTableStructures(value, nestedTableName);
      structures.push(...arrayStructures);
    } else if (typeof value === "object" && value !== null) {
      // Create separate table for nested object using the key name
      const nestedTableName = `${baseTableName}_${key}`;
      const nestedStructures = flattenObjectToTables(
        value as Record<string, JsonValue>,
        nestedTableName,
      );
      structures.push(...nestedStructures);
    } else {
      // Keep primitive values in main table
      mainTableData[key] = value;
    }
  }

  // Create main table only if it has primitive values
  if (Object.keys(mainTableData).length > 0) {
    const mainSchema = inferSchema([mainTableData], baseTableName);
    structures.unshift({
      schema: mainSchema,
      data: [mainTableData],
    });
  }

  return structures;
}
