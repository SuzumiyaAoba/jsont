/**
 * Legacy JSON Parser - Re-exported from enhanced jsonProcessor
 * Maintains backward compatibility while using enhanced features
 */

import type { JsonValue } from "../types/index";
import {
  formatJsonValue as enhancedFormatJsonValue,
  parseJsonSafely as enhancedParseJsonSafely,
} from "./jsonProcessor";

/**
 * @deprecated Use parseJsonSafely from jsonProcessor.ts for enhanced features
 */
export function parseJsonSafely(input: string): {
  data: JsonValue;
  error: string | null;
} {
  const result = enhancedParseJsonSafely(input);
  return {
    data: result.data,
    error: result.error,
  };
}

/**
 * @deprecated Use formatJsonValue from jsonProcessor.ts for enhanced features
 */
export function formatJsonValue(value: JsonValue): string {
  return enhancedFormatJsonValue(value);
}
