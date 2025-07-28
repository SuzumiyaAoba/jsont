/**
 * SQL converter module exports
 */

export {
  extractTableStructures,
  normalizeDataForSQL,
} from "./dataTransformation";
export { getDialectConfig } from "./dialectSupport";
export {
  inferSchema,
  inferSqlType,
  shouldUseMultiTableStructure,
} from "./schemaInference";
export { generateCreateTable, generateInsertStatements } from "./sqlGeneration";
export type {
  ColumnInfo,
  SqlDialectConfig,
  TableSchema,
  TableStructure,
} from "./types";
export { escapeSqlString, formatSqlValue } from "./valueFormatting";
