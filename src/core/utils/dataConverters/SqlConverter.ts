/**
 * SQL data converter
 */

import type { JsonValue } from "@core/types/index";
import { err, ok } from "neverthrow";
import type {
  ConversionResult,
  DataConverter,
  DataValidationResult,
  SqlOptions,
} from "./types";

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
}

interface TableSchema {
  tableName: string;
  columns: ColumnInfo[];
}

export class SqlConverter implements DataConverter<SqlOptions> {
  readonly format = "sql";
  readonly extension = ".sql";
  readonly displayName = "SQL";

  convert(
    data: JsonValue,
    options?: SqlOptions | Record<string, unknown>,
  ): ConversionResult {
    try {
      const sqlOptions = { ...this.getDefaultOptions(), ...options };
      const result = this.convertToSQL(data, sqlOptions);

      return ok(result);
    } catch (error) {
      return err({
        type: "CONVERSION_ERROR" as const,
        message:
          error instanceof Error ? error.message : "SQL conversion failed",
        format: this.format,
        context: { options },
      });
    }
  }

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
        const firstKeys = Object.keys(
          data[0] as Record<string, unknown>,
        ).sort();
        const inconsistentStructure = data.some((item) => {
          if (
            typeof item !== "object" ||
            item === null ||
            Array.isArray(item)
          ) {
            return true;
          }
          const itemKeys = Object.keys(item as Record<string, unknown>).sort();
          return JSON.stringify(itemKeys) !== JSON.stringify(firstKeys);
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
    };
  }

  private convertToSQL(data: JsonValue, options: SqlOptions): string {
    const { tableName, includeCreateTable } = options;
    let sql = "";

    // Add header comment
    sql += `-- Generated SQL for table: ${tableName}\n`;
    sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

    if (data === null || data === undefined) {
      if (includeCreateTable) {
        sql += this.generateCreateTable({ tableName, columns: [] }, options);
      }
      sql += `-- No data to insert\n`;
      return sql;
    }

    // Normalize data to array of objects
    const normalizedData = this.normalizeDataForSQL(data);

    if (normalizedData.length === 0) {
      if (includeCreateTable) {
        sql += this.generateCreateTable({ tableName, columns: [] }, options);
      }
      sql += `-- No data to insert\n`;
      return sql;
    }

    // Infer schema from data
    const schema = this.inferSchema(normalizedData, tableName);

    // Generate CREATE TABLE statement if requested
    if (includeCreateTable) {
      sql += this.generateCreateTable(schema, options);
      sql += "\n";
    }

    // Generate INSERT statements
    sql += this.generateInsertStatements(normalizedData, schema, options);

    return sql;
  }

  private normalizeDataForSQL(data: JsonValue): Record<string, JsonValue>[] {
    if (Array.isArray(data)) {
      return data
        .filter(
          (item) =>
            typeof item === "object" && item !== null && !Array.isArray(item),
        )
        .map((item) => item as Record<string, JsonValue>);
    }

    if (typeof data === "object" && data !== null && !Array.isArray(data)) {
      return [data as Record<string, JsonValue>];
    }

    // Convert primitive to single-column object
    return [{ value: data }];
  }

  private inferSchema(
    data: Record<string, JsonValue>[],
    tableName: string,
  ): TableSchema {
    const columns: ColumnInfo[] = [];
    const columnStats = new Map<
      string,
      { types: Set<string>; nullCount: number; totalCount: number }
    >();

    // Analyze all data to determine column types and nullability
    for (const row of data) {
      const processedColumns = new Set<string>();

      for (const [key, value] of Object.entries(row)) {
        processedColumns.add(key);

        if (!columnStats.has(key)) {
          columnStats.set(key, {
            types: new Set(),
            nullCount: 0,
            totalCount: 0,
          });
        }

        const stats = columnStats.get(key);
        if (!stats) continue;
        stats.totalCount++;

        if (value === null || value === undefined) {
          stats.nullCount++;
        } else {
          const sqlType = this.inferSqlType(value);
          stats.types.add(sqlType);
        }
      }

      // Mark missing columns as having null values
      for (const [columnName, stats] of columnStats) {
        if (!processedColumns.has(columnName)) {
          stats.totalCount++;
          stats.nullCount++;
        }
      }
    }

    // Convert stats to column definitions
    for (const [columnName, stats] of columnStats) {
      const nullable = stats.nullCount > 0;
      const types = Array.from(stats.types);

      // Determine the best SQL type
      let sqlType = "TEXT"; // Default fallback

      if (types.length === 1) {
        sqlType = types[0] || "TEXT";
      } else if (types.length > 1) {
        // Handle mixed types
        if (types.includes("INTEGER") && types.includes("REAL")) {
          sqlType = "REAL"; // Promote to floating point
        } else {
          sqlType = "TEXT"; // Fallback to text for mixed types
        }
      }

      columns.push({
        name: columnName,
        type: sqlType,
        nullable,
      });
    }

    return { tableName, columns };
  }

  private inferSqlType(value: JsonValue): string {
    if (typeof value === "number") {
      return Number.isInteger(value) ? "INTEGER" : "REAL";
    }
    if (typeof value === "boolean") {
      return "BOOLEAN";
    }
    if (typeof value === "string") {
      // Check if it looks like a date
      if (this.isDateString(value)) {
        return "TIMESTAMP";
      }
      return "TEXT";
    }
    if (Array.isArray(value)) {
      return "TEXT"; // Store as JSON string
    }
    if (typeof value === "object" && value !== null) {
      return "TEXT"; // Store as JSON string
    }
    return "TEXT";
  }

  private isDateString(str: string): boolean {
    // Simple heuristic for ISO date strings
    const isoDateRegex =
      /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?)?$/;
    return isoDateRegex.test(str) && !Number.isNaN(Date.parse(str));
  }

  private generateCreateTable(
    schema: TableSchema,
    options: SqlOptions,
  ): string {
    const { dialect, escapeIdentifiers } = options;
    const escapeId = escapeIdentifiers
      ? this.getIdentifierEscaper(dialect)
      : (id: string) => id;

    let sql = `CREATE TABLE ${escapeId(schema.tableName)} (\n`;

    if (schema.columns.length === 0) {
      sql += `  ${escapeId("id")} ${this.getAutoIncrementType(dialect)} PRIMARY KEY\n`;
    } else {
      const columnDefs = schema.columns.map((col) => {
        const nullable = col.nullable ? "" : " NOT NULL";
        const sqlType = this.adaptTypeForDialect(col.type, dialect);
        return `  ${escapeId(col.name)} ${sqlType}${nullable}`;
      });

      sql += columnDefs.join(",\n");
      sql += "\n";
    }

    sql += ");\n";
    return sql;
  }

  private generateInsertStatements(
    data: Record<string, JsonValue>[],
    schema: TableSchema,
    options: SqlOptions,
  ): string {
    const { tableName, batchSize, dialect, escapeIdentifiers } = options;
    const escapeId = escapeIdentifiers
      ? this.getIdentifierEscaper(dialect)
      : (id: string) => id;

    if (data.length === 0) {
      return "-- No data to insert\n";
    }

    let sql = "";
    const columnNames = schema.columns.map((col) => escapeId(col.name));

    // Process data in batches
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      if (dialect === "mysql" || dialect === "postgresql") {
        // Use multi-row INSERT
        sql += `INSERT INTO ${escapeId(tableName)} (${columnNames.join(", ")}) VALUES\n`;

        const valueRows = batch.map((row) => {
          const values = schema.columns.map((col) => {
            const value = row[col.name] ?? null;
            return this.formatSqlValue(value, col.type, dialect);
          });
          return `  (${values.join(", ")})`;
        });

        sql += valueRows.join(",\n");
        sql += ";\n\n";
      } else {
        // Use individual INSERT statements for SQLite and SQL Server
        for (const row of batch) {
          const values = schema.columns.map((col) => {
            const value = row[col.name] ?? null;
            return this.formatSqlValue(value, col.type, dialect);
          });

          sql += `INSERT INTO ${escapeId(tableName)} (${columnNames.join(", ")}) VALUES (${values.join(", ")});\n`;
        }
        sql += "\n";
      }
    }

    return sql;
  }

  private formatSqlValue(
    value: JsonValue,
    columnType: string,
    dialect: string,
  ): string {
    if (value === null || value === undefined) {
      return "NULL";
    }

    if (columnType === "INTEGER" || columnType === "REAL") {
      return String(value);
    }

    if (columnType === "BOOLEAN") {
      if (dialect === "mysql") {
        return value ? "TRUE" : "FALSE";
      } else if (dialect === "postgresql") {
        return value ? "true" : "false";
      } else {
        return value ? "1" : "0";
      }
    }

    // For TEXT, TIMESTAMP, and complex types, escape as string
    const stringValue =
      typeof value === "object" ? JSON.stringify(value) : String(value);
    return this.escapeSqlString(stringValue);
  }

  private escapeSqlString(str: string): string {
    return `'${str.replace(/'/g, "''")}'`;
  }

  private getIdentifierEscaper(
    dialect: string,
  ): (identifier: string) => string {
    switch (dialect) {
      case "mysql":
        return (id) => `\`${id}\``;
      case "postgresql":
        return (id) => `"${id}"`;
      case "mssql":
        return (id) => `[${id}]`;
      default:
        return (id) => `"${id}"`;
    }
  }

  private getAutoIncrementType(dialect: string): string {
    switch (dialect) {
      case "mysql":
        return "INT AUTO_INCREMENT";
      case "postgresql":
        return "SERIAL";
      case "mssql":
        return "INT IDENTITY(1,1)";
      default:
        return "INTEGER PRIMARY KEY AUTOINCREMENT";
    }
  }

  private adaptTypeForDialect(type: string, dialect: string): string {
    switch (dialect) {
      case "mysql":
        return (
          {
            TEXT: "TEXT",
            INTEGER: "INT",
            REAL: "DOUBLE",
            BOOLEAN: "BOOLEAN",
            TIMESTAMP: "DATETIME",
          }[type] || "TEXT"
        );

      case "postgresql":
        return (
          {
            TEXT: "TEXT",
            INTEGER: "INTEGER",
            REAL: "REAL",
            BOOLEAN: "BOOLEAN",
            TIMESTAMP: "TIMESTAMP",
          }[type] || "TEXT"
        );

      case "mssql":
        return (
          {
            TEXT: "NVARCHAR(MAX)",
            INTEGER: "INT",
            REAL: "FLOAT",
            BOOLEAN: "BIT",
            TIMESTAMP: "DATETIME2",
          }[type] || "NVARCHAR(MAX)"
        );
      default:
        return (
          {
            TEXT: "TEXT",
            INTEGER: "INTEGER",
            REAL: "REAL",
            BOOLEAN: "INTEGER",
            TIMESTAMP: "TEXT",
          }[type] || "TEXT"
        );
    }
  }
}
