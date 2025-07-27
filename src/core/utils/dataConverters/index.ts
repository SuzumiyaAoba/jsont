/**
 * Data converters registry and utilities
 */

import { CsvConverter } from "./CsvConverter";
import { JsonConverter } from "./JsonConverter";
import { SchemaConverter } from "./SchemaConverter";
import { SqlConverter } from "./SqlConverter";
import type { DataConverter } from "./types";
import { XmlConverter } from "./XmlConverter";
import { YamlConverter } from "./YamlConverter";

// Export types
export type * from "./types";

// Export individual converters
export {
  CsvConverter,
  JsonConverter,
  SchemaConverter,
  SqlConverter,
  XmlConverter,
  YamlConverter,
};

// Create converter instances
export const dataConverters = {
  json: new JsonConverter(),
  yaml: new YamlConverter(),
  csv: new CsvConverter(),
  schema: new SchemaConverter(),
  xml: new XmlConverter(),
  sql: new SqlConverter(),
} as const;

// Export format type
export type SupportedFormat = keyof typeof dataConverters;

// Registry class for managing converters
export class DataConverterRegistry {
  private converters = new Map<string, DataConverter>();

  constructor() {
    // Register default converters
    this.register(dataConverters.json);
    this.register(dataConverters.yaml);
    this.register(dataConverters.csv);
    this.register(dataConverters.schema);
    this.register(dataConverters.xml);
    this.register(dataConverters.sql);
  }

  register(converter: DataConverter): void {
    this.converters.set(converter.format, converter);
  }

  unregister(format: string): boolean {
    return this.converters.delete(format);
  }

  get(format: string): DataConverter | undefined {
    return this.converters.get(format);
  }

  getAvailableFormats(): string[] {
    return Array.from(this.converters.keys());
  }

  getAllConverters(): DataConverter[] {
    return Array.from(this.converters.values());
  }

  getFormatExtension(format: string): string {
    const converter = this.get(format);
    return converter?.extension || ".txt";
  }

  getFormatDisplayName(format: string): string {
    const converter = this.get(format);
    return converter?.displayName || format.toUpperCase();
  }
}

// Default registry instance
export const dataConverterRegistry = new DataConverterRegistry();
