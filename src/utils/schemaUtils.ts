/**
 * JSON Schema inference and utilities with Result-based error handling
 */

import { err, ok, type Result } from "neverthrow";
import type { JsonArray, JsonObject, JsonValue } from "../types";
import type { SchemaGenerationError } from "./result";

export interface JsonSchemaProperty {
  type: string;
  description?: string;
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
  required?: string[];
  enum?: JsonValue[];
  examples?: JsonValue[];
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  additionalProperties?: boolean;
}

export interface JsonSchema {
  $schema?: string;
  type: string;
  title?: string;
  description?: string;
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
  required?: string[];
  additionalProperties?: boolean;
  examples?: JsonValue[];
}

/**
 * Infer JSON Schema from a JSON value (legacy function)
 */
export function inferJsonSchema(data: JsonValue, title?: string): JsonSchema {
  const schema = inferType(data);

  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: title || "Generated Schema",
    description: `Auto-generated schema from JSON data`,
    ...schema,
  };
}

/**
 * Safely infer JSON Schema from a JSON value with Result type
 */
export function safeInferJsonSchema(
  data: JsonValue,
  title?: string,
): Result<JsonSchema, SchemaGenerationError> {
  try {
    if (data === undefined) {
      return err({
        type: "SCHEMA_ERROR" as const,
        message: "Cannot generate schema from undefined value",
        context: "data validation",
      });
    }

    const schema = inferType(data);

    const result: JsonSchema = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      title: title || "Generated Schema",
      description: `Auto-generated schema from JSON data`,
      ...schema,
    };

    return ok(result);
  } catch (error) {
    return err({
      type: "SCHEMA_ERROR" as const,
      message:
        error instanceof Error ? error.message : "Schema generation failed",
      context: "schema inference",
    });
  }
}

/**
 * Infer type and schema properties for a JSON value
 */
function inferType(value: JsonValue): JsonSchemaProperty {
  if (value === null) {
    return { type: "null" };
  }

  if (typeof value === "boolean") {
    return { type: "boolean" };
  }

  if (typeof value === "number") {
    const schema: JsonSchemaProperty = { type: "number" };
    if (Number.isInteger(value)) {
      schema.type = "integer";
    }
    return schema;
  }

  if (typeof value === "string") {
    const schema: JsonSchemaProperty = { type: "string" };

    // Detect common string formats
    if (isEmail(value)) {
      schema.format = "email";
    } else if (isUri(value)) {
      schema.format = "uri";
    } else if (isDate(value)) {
      schema.format = "date-time";
    } else if (isUuid(value)) {
      schema.format = "uuid";
    }

    schema.minLength = value.length;
    schema.maxLength = value.length;

    return schema;
  }

  if (Array.isArray(value)) {
    return inferArraySchema(value);
  }

  if (typeof value === "object") {
    return inferObjectSchema(value as JsonObject);
  }

  return { type: "string" }; // fallback
}

/**
 * Infer schema for an array
 */
function inferArraySchema(array: JsonArray): JsonSchemaProperty {
  if (array.length === 0) {
    return {
      type: "array",
      items: { type: "string" }, // default for empty arrays
    };
  }

  // Find the most common type in the array
  const typeMap = new Map<string, JsonSchemaProperty>();
  const typeCount = new Map<string, number>();

  for (const item of array) {
    const itemSchema = inferType(item);
    const typeKey = getTypeKey(itemSchema);

    if (!typeMap.has(typeKey)) {
      typeMap.set(typeKey, itemSchema);
      typeCount.set(typeKey, 0);
    }

    typeCount.set(typeKey, (typeCount.get(typeKey) || 0) + 1);
  }

  // Use the most common type
  let mostCommonType = "";
  let maxCount = 0;

  for (const [type, count] of typeCount.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonType = type;
    }
  }

  const itemsSchema = typeMap.get(mostCommonType) || { type: "string" };

  return {
    type: "array",
    items: itemsSchema,
  };
}

/**
 * Infer schema for an object
 */
function inferObjectSchema(obj: JsonObject): JsonSchemaProperty {
  const properties: Record<string, JsonSchemaProperty> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    properties[key] = inferType(value);
    required.push(key); // All present properties are considered required
  }

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

/**
 * Generate a unique key for a schema type for deduplication
 */
function getTypeKey(schema: JsonSchemaProperty): string {
  const parts = [schema.type];

  if (schema.format) {
    parts.push(schema.format);
  }

  if (schema.properties) {
    const propKeys = Object.keys(schema.properties).sort();
    parts.push(`props:${propKeys.join(",")}`);
  }

  return parts.join("|");
}

/**
 * Format JSON Schema as a readable string (legacy function)
 */
export function formatJsonSchema(schema: JsonSchema): string {
  return JSON.stringify(schema, null, 2);
}

/**
 * Safely format JSON Schema as a readable string with Result type
 */
export function safeFormatJsonSchema(
  schema: JsonSchema,
): Result<string, SchemaGenerationError> {
  try {
    const formatted = JSON.stringify(schema, null, 2);

    if (!formatted) {
      return err({
        type: "SCHEMA_ERROR" as const,
        message: "Failed to serialize schema to JSON string",
        context: "schema formatting",
      });
    }

    return ok(formatted);
  } catch (error) {
    return err({
      type: "SCHEMA_ERROR" as const,
      message:
        error instanceof Error ? error.message : "Schema formatting failed",
      context: "JSON serialization",
    });
  }
}

/**
 * Check if a string looks like an email
 */
function isEmail(str: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}

/**
 * Check if a string looks like a URI
 */
function isUri(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a string looks like an ISO date
 */
function isDate(str: string): boolean {
  // Check for ISO 8601 format
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  if (isoDateRegex.test(str)) {
    const date = new Date(str);
    return !Number.isNaN(date.getTime());
  }
  return false;
}

/**
 * Check if a string looks like a UUID
 */
function isUuid(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Get schema statistics
 */
export interface SchemaStats {
  totalProperties: number;
  maxDepth: number;
  typeDistribution: Record<string, number>;
}

export function getSchemaStats(schema: JsonSchema): SchemaStats {
  const stats: SchemaStats = {
    totalProperties: 0,
    maxDepth: 0,
    typeDistribution: {},
  };

  function analyzeSchema(s: JsonSchemaProperty, depth = 0): void {
    stats.maxDepth = Math.max(stats.maxDepth, depth);

    // Count types
    const type = s.type;
    stats.typeDistribution[type] = (stats.typeDistribution[type] || 0) + 1;

    if (s.properties) {
      stats.totalProperties += Object.keys(s.properties).length;
      for (const prop of Object.values(s.properties)) {
        analyzeSchema(prop, depth + 1);
      }
    }

    if (s.items) {
      analyzeSchema(s.items, depth + 1);
    }
  }

  analyzeSchema(schema);
  return stats;
}

/**
 * Safely get schema statistics with Result type
 */
export function safeGetSchemaStats(
  schema: JsonSchema,
): Result<SchemaStats, SchemaGenerationError> {
  try {
    const stats: SchemaStats = {
      totalProperties: 0,
      maxDepth: 0,
      typeDistribution: {},
    };

    let recursionDepth = 0;
    const MAX_RECURSION_DEPTH = 1000;

    function analyzeSchema(s: JsonSchemaProperty, depth = 0): void {
      recursionDepth++;

      if (recursionDepth > MAX_RECURSION_DEPTH) {
        throw new Error(
          "Maximum recursion depth exceeded during schema analysis",
        );
      }

      stats.maxDepth = Math.max(stats.maxDepth, depth);

      // Count types
      const type = s.type;
      if (typeof type === "string") {
        stats.typeDistribution[type] = (stats.typeDistribution[type] || 0) + 1;
      }

      if (s.properties) {
        stats.totalProperties += Object.keys(s.properties).length;
        for (const prop of Object.values(s.properties)) {
          analyzeSchema(prop, depth + 1);
        }
      }

      if (s.items) {
        analyzeSchema(s.items, depth + 1);
      }

      recursionDepth--;
    }

    analyzeSchema(schema);
    return ok(stats);
  } catch (error) {
    return err({
      type: "SCHEMA_ERROR" as const,
      message:
        error instanceof Error ? error.message : "Schema analysis failed",
      context: "statistics calculation",
    });
  }
}
