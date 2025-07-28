/**
 * SQL converter types and interfaces
 */

import type { JsonValue } from "@core/types/index";

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
}

export interface TableSchema {
  tableName: string;
  columns: ColumnInfo[];
}

export interface TableStructure {
  schema: TableSchema;
  data: Record<string, JsonValue>[];
}

export interface SqlDialectConfig {
  escapeIdentifier: (identifier: string) => string;
  getAutoIncrementType: () => string;
  adaptType: (type: string) => string;
}
