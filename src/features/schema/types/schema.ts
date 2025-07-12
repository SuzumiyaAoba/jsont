/**
 * JSON Schema functionality type definitions
 */

import type { JsonValue } from "../../../core/types/index.js";
import type { SearchResult } from "../../search/types/search.js";

export interface BaseSchemaProperties {
  type: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: JsonValue[];
  const?: JsonValue;
  examples?: JsonValue[];
}

export interface JsonSchema extends BaseSchemaProperties {
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
  title?: string;
  description?: string;
  required?: string[];
  additionalProperties?: boolean;
  minItems?: number;
  maxItems?: number;
}

export interface JsonSchemaProperty extends BaseSchemaProperties {
  description?: string;
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
  required?: string[];
  additionalProperties?: boolean;
  minItems?: number;
  maxItems?: number;
}

export interface SchemaViewerProps {
  data: JsonValue | null;
  scrollOffset: number;
  searchTerm: string;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  visibleLines: number;
  showLineNumbers: boolean;
}

export interface SchemaInferenceOptions {
  title?: string;
  includeExamples?: boolean;
  strictTypes?: boolean;
  mergeArrayItems?: boolean;
}
