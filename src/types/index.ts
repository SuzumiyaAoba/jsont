/**
 * Type definitions for jsont application
 */

// Basic JSON types
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export interface JsonArray extends Array<JsonValue> {}

// Application state types
export interface AppState {
  data: unknown;
  filter: string;
  error: string | null;
  selectedPath: string[];
}

// Export default to satisfy ES module requirements
export default {};
