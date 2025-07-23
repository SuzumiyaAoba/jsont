/**
 * jq transformation utilities
 */

import jq from "node-jq";
import type { JqTransformationResult } from "../types/jq";

/**
 * Transform JSON data using jq query
 */
export async function transformWithJq(
  data: unknown,
  query: string,
): Promise<JqTransformationResult> {
  console.log(
    "transformWithJq called with query:",
    query,
    "data type:",
    typeof data,
  );

  try {
    // Validate query
    if (!query || query.trim() === "") {
      console.log("Empty query, returning original data");
      return { success: true, data: data }; // Return original data for empty query
    }

    // Clean and validate query
    const cleanQuery = query.trim();

    // Convert data to JSON string for jq processing
    let jsonString: string;
    try {
      jsonString = JSON.stringify(data);
    } catch (serializeError) {
      return {
        success: false,
        error: `Failed to serialize data: ${serializeError instanceof Error ? serializeError.message : "Unknown error"}`,
      };
    }

    // Basic validation to check if jq query syntax is reasonable
    if (cleanQuery.includes("..") && !cleanQuery.match(/\.\.[.[\]]/)) {
      return {
        success: false,
        error:
          "Invalid recursive descent operator. Use '..' or '.[]' or '.field' syntax",
      };
    }

    // Run jq transformation with better error handling
    console.log(
      "About to run jq with query:",
      cleanQuery,
      "on data length:",
      jsonString.length,
    );
    let result: string | object;
    try {
      result = await jq.run(cleanQuery, jsonString, {
        input: "string",
        raw: false, // Ensure JSON output
      });
      console.log("jq transformation successful, result type:", typeof result);
    } catch (jqError) {
      console.log("jq transformation failed:", jqError);
      // Improve jq error messages
      let errorMsg =
        jqError instanceof Error ? jqError.message : "Unknown jq error";

      // Clean up common jq error messages
      if (errorMsg.includes("jq: error")) {
        errorMsg = errorMsg.replace(/^jq: error.*?:/, "").trim();
      }
      if (errorMsg.includes("compile error")) {
        errorMsg = `Syntax error: ${errorMsg.replace(/.*compile error.*?:/, "").trim()}`;
      }

      return {
        success: false,
        error: `jq: ${errorMsg}`,
      };
    }

    // Parse result back to JSON if possible
    let transformedData: unknown;
    if (typeof result === "string") {
      try {
        transformedData = JSON.parse(result);
      } catch {
        // If result is not valid JSON, return as string (for raw output)
        transformedData = result.trim();
      }
    } else {
      // Result is already an object
      transformedData = result;
    }

    return {
      success: true,
      data: transformedData,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown jq error";
    return {
      success: false,
      error: `Unexpected error: ${errorMessage}`,
    };
  }
}

/**
 * Validate jq query syntax
 */
export function validateJqQuery(query: string): {
  valid: boolean;
  error?: string;
} {
  if (!query || query.trim() === "") {
    return { valid: false, error: "Empty query" };
  }

  // Basic syntax validation
  const cleanQuery = query.trim();

  // Check for basic jq syntax patterns
  if (cleanQuery.includes("..") && !cleanQuery.includes("...")) {
    // Only allow recursive descent with proper syntax
    return { valid: true };
  }

  // Check for common jq operators
  const jqOperators = [
    ".",
    "[",
    "]",
    "|",
    "?",
    "==",
    "!=",
    "<",
    ">",
    "<=",
    ">=",
  ];
  const hasValidOperator = jqOperators.some((op) => cleanQuery.includes(op));

  if (!hasValidOperator && !cleanQuery.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
    return { valid: false, error: "Invalid jq syntax" };
  }

  return { valid: true };
}

/**
 * Get common jq query examples
 */
export function getJqExamples(): string[] {
  return [
    ".",
    ".[]",
    ".name",
    ".users[]",
    ".users[0]",
    ".users[] | .name",
    ".users | length",
    ".users[] | select(.age > 18)",
    ".users[] | {name, email}",
    "keys",
    "values",
    "type",
    "length",
    "sort_by(.name)",
    "group_by(.category)",
    "map(.name)",
    'has("key")',
    "empty",
    "error",
  ];
}
