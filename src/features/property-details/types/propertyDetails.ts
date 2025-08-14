/**
 * Types for property details display feature
 */

import type { JsonValue } from "@core/types/index";

/**
 * Information about the currently selected property
 */
export interface PropertyDetails {
  /** Full path to the property (e.g., ["user", "profile", "name"]) */
  path: (string | number)[];

  /** Property name/key */
  key: string | number | null;

  /** Property value (untruncated) */
  value: JsonValue;

  /** Type of the property value */
  type: "string" | "number" | "boolean" | "null" | "object" | "array";

  /** Full path as a string (e.g., "user.profile.name") */
  pathString: string;

  /** Formatted value string (without truncation) */
  valueString: string;

  /** Whether the property has children */
  hasChildren: boolean;

  /** Number of children if applicable */
  childrenCount: number | undefined;
}

/**
 * Configuration for property details display
 */
export interface PropertyDetailsConfig {
  /** Whether to show property details */
  enabled: boolean;

  /** Maximum height for the property details area */
  maxHeight: number;

  /** Whether to show the full path */
  showPath: boolean;

  /** Whether to show the property type */
  showType: boolean;

  /** Whether to show children count for objects/arrays */
  showChildrenCount: boolean;
}
