/**
 * SQL data converter - Refactored with modular structure
 */

import type { JsonValue } from "@core/types/index";
import { err, ok } from "neverthrow";
import {
  extractTableStructures,
  generateCreateTable,
  generateInsertStatements,
  inferSchema,
  normalizeDataForSQL,
  shouldUseMultiTableStructure,
} from "./sql";
import type { DataValidationResult, SqlOptions } from "./types";
import { BaseDataConverter } from "./types";

export class SqlConverter extends BaseDataConverter<SqlOptions> {
  readonly format = "sql";
  readonly extension = ".sql";
  readonly displayName = "SQL";

  validate(data: JsonValue): DataValidationResult {
    // SQL converter works best with arrays of objects (table rows)
    // But can also handle single objects and other structures
    if (data === null || data === undefined) {
      return ok(undefined);
    }

    if (Array.isArray(data)) {
      // Check if array contains objects (ideal for SQL tables)
      if (data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
        // Validate all elements are objects with consistent structure
        const firstKeys = new Set(
          Object.keys(data[0] as Record<string, unknown>),
        );
        const inconsistentStructure = data.some((item) => {
          if (
            typeof item !== "object" ||
            item === null ||
            Array.isArray(item)
          ) {
            return true;
          }
          const itemKeys = new Set(
            Object.keys(item as Record<string, unknown>),
          );
          return (
            firstKeys.size !== itemKeys.size ||
            ![...firstKeys].every((key) => itemKeys.has(key))
          );
        });

        if (inconsistentStructure) {
          return err({
            type: "VALIDATION_ERROR" as const,
            message:
              "Array contains objects with inconsistent structure. SQL conversion requires uniform object structure.",
            format: this.format,
          });
        }
      }
      return ok(undefined);
    }

    if (typeof data === "object" && data !== null) {
      return ok(undefined);
    }

    // Primitives can be converted as single-row tables
    return ok(undefined);
  }

  getDefaultOptions(): SqlOptions {
    return {
      tableName: "data_table",
      dialect: "postgresql",
      includeCreateTable: true,
      batchSize: 1000,
      escapeIdentifiers: true,
      useMultiTableStructure: true,
    };
  }

  protected performConversion(data: JsonValue, options: SqlOptions): string {
    const { tableName, includeCreateTable } = options;
    let sql = "";

    // Add header comment
    sql += `-- Generated SQL for table: ${tableName}\n`;
    sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

    if (data === null || data === undefined) {
      if (includeCreateTable) {
        sql += generateCreateTable({ tableName, columns: [] }, options);
      }
      sql += `-- No data to insert\n`;
      return sql;
    }

    // Check if we should use multi-table structure
    if (options.useMultiTableStructure && shouldUseMultiTableStructure(data)) {
      return this.convertToMultiTableSQL(data, options);
    }

    // Use original single-table logic for simple cases
    const normalizedData = normalizeDataForSQL(data);

    if (normalizedData.length === 0) {
      if (includeCreateTable) {
        sql += generateCreateTable({ tableName, columns: [] }, options);
      }
      sql += `-- No data to insert\n`;
      return sql;
    }

    // Infer schema from data
    const schema = inferSchema(normalizedData, tableName);

    // Generate CREATE TABLE statement if requested
    if (includeCreateTable) {
      sql += generateCreateTable(schema, options);
      sql += "\n";
    }

    // Generate INSERT statements
    sql += generateInsertStatements(normalizedData, schema, options);

    return sql;
  }

  /**
   * Convert data using multi-table structure
   */
  private convertToMultiTableSQL(data: JsonValue, options: SqlOptions): string {
    let sql = "";

    // Add header comment
    sql += `-- Generated SQL with multi-table structure\n`;
    sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

    // Generate multi-table SQL structure
    const tableStructures = extractTableStructures(
      data,
      options.tableName || "data",
    );

    if (tableStructures.length === 0) {
      sql += `-- No valid table structures found\n`;
      return sql;
    }

    // Generate SQL for each table
    for (const structure of tableStructures) {
      // Generate CREATE TABLE statement if requested
      if (options.includeCreateTable) {
        sql += generateCreateTable(structure.schema, options);
        sql += "\n";
      }

      // Generate INSERT statements
      if (structure.data.length > 0) {
        sql += generateInsertStatements(
          structure.data,
          structure.schema,
          options,
        );
        sql += "\n";
      } else {
        sql += `-- No data to insert for table: ${structure.schema.tableName}\n\n`;
      }
    }

    return sql;
  }
}
