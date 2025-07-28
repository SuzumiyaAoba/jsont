/**
 * SQL statement generation utilities
 */

import type { JsonValue } from "@core/types/index";
import type { SqlOptions } from "../types";
import { getDialectConfig } from "./dialectSupport";
import type { TableSchema } from "./types";
import { formatSqlValue } from "./valueFormatting";

/**
 * Generate CREATE TABLE statement
 */
export function generateCreateTable(
  schema: TableSchema,
  options: SqlOptions,
): string {
  const { tableName, columns } = schema;
  const { dialect = "postgresql", escapeIdentifiers = true } = options;

  const dialectConfig = getDialectConfig(dialect);
  const escapeId = escapeIdentifiers
    ? dialectConfig.escapeIdentifier
    : (id: string) => id;

  let sql = `CREATE TABLE ${escapeId(tableName)} (\n`;

  if (columns.length === 0) {
    sql += `  id ${dialectConfig.getAutoIncrementType()}\n`;
  } else {
    const columnDefs = columns.map((col) => {
      const adaptedType = dialectConfig.adaptType(col.type);
      const nullClause = col.nullable ? "" : " NOT NULL";
      return `  ${escapeId(col.name)} ${adaptedType}${nullClause}`;
    });

    sql += columnDefs.join(",\n");
  }

  sql += "\n);";
  return sql;
}

/**
 * Generate INSERT statements for data
 */
export function generateInsertStatements(
  data: Record<string, JsonValue>[],
  schema: TableSchema,
  options: SqlOptions,
): string {
  if (data.length === 0) {
    return `-- No data to insert for table: ${schema.tableName}`;
  }

  const { tableName, columns } = schema;
  const {
    batchSize = 1000,
    dialect = "postgresql",
    escapeIdentifiers = true,
  } = options;

  // SQLite doesn't support multi-row inserts as well, use batch size 1
  const effectiveBatchSize = dialect === "sqlite" ? 1 : batchSize;

  const dialectConfig = getDialectConfig(dialect);
  const escapeId = escapeIdentifiers
    ? dialectConfig.escapeIdentifier
    : (id: string) => id;

  let sql = "";

  // Process data in batches
  for (let i = 0; i < data.length; i += effectiveBatchSize) {
    const batch = data.slice(i, i + effectiveBatchSize);

    if (columns.length === 0) {
      // Empty table case
      sql += `INSERT INTO ${escapeId(tableName)} DEFAULT VALUES;\n`;
      continue;
    }

    // Get column names for this batch
    const columnNames = columns.map((col) => escapeId(col.name));
    sql += `INSERT INTO ${escapeId(tableName)} (${columnNames.join(", ")}) VALUES\n`;

    // Generate values for each row
    const valueRows = batch.map((row) => {
      const values = columns.map((col) => {
        const value = row[col.name] ?? null;
        return formatSqlValue(value, dialect);
      });
      return `  (${values.join(", ")})`;
    });

    sql += valueRows.join(",\n");
    sql += ";\n\n";
  }

  return sql;
}
