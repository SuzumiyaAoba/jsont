/**
 * SQL dialect-specific functionality
 */

import type { SqlDialectConfig } from "./types";

/**
 * Get dialect-specific configuration
 */
export function getDialectConfig(dialect: string): SqlDialectConfig {
  switch (dialect) {
    case "mysql":
      return {
        escapeIdentifier: (id: string) => `\`${id}\``,
        getAutoIncrementType: () => "INT AUTO_INCREMENT PRIMARY KEY",
        adaptType: (type: string) => adaptTypeForMySQL(type),
      };

    case "sqlite":
      return {
        escapeIdentifier: (id: string) => `"${id}"`,
        getAutoIncrementType: () => "INTEGER PRIMARY KEY AUTOINCREMENT",
        adaptType: (type: string) => adaptTypeForSQLite(type),
      };

    case "sqlserver":
      return {
        escapeIdentifier: (id: string) => `[${id}]`,
        getAutoIncrementType: () => "INT IDENTITY(1,1) PRIMARY KEY",
        adaptType: (type: string) => adaptTypeForSQLServer(type),
      };

    case "postgresql":
    default:
      return {
        escapeIdentifier: (id: string) => `"${id}"`,
        getAutoIncrementType: () => "SERIAL PRIMARY KEY",
        adaptType: (type: string) => adaptTypeForPostgreSQL(type),
      };
  }
}

/**
 * Adapt SQL types for MySQL dialect
 */
function adaptTypeForMySQL(type: string): string {
  switch (type) {
    case "INTEGER":
      return "INT";
    case "BOOLEAN":
      return "TINYINT(1)";
    case "JSONB":
      return "JSON";
    case "TIMESTAMP":
      return "DATETIME";
    case "DECIMAL":
      return "DECIMAL(10,2)";
    default:
      return type;
  }
}

/**
 * Adapt SQL types for SQLite dialect
 */
function adaptTypeForSQLite(type: string): string {
  switch (type) {
    case "VARCHAR(255)":
      return "TEXT";
    case "JSONB":
      return "TEXT"; // SQLite doesn't have native JSON type
    case "BOOLEAN":
      return "INTEGER"; // SQLite uses INTEGER for boolean
    case "DECIMAL":
      return "REAL";
    default:
      return type;
  }
}

/**
 * Adapt SQL types for SQL Server dialect
 */
function adaptTypeForSQLServer(type: string): string {
  switch (type) {
    case "TEXT":
      return "NVARCHAR(MAX)";
    case "BOOLEAN":
      return "BIT";
    case "JSONB":
      return "NVARCHAR(MAX)"; // SQL Server 2016+ has JSON support
    case "TIMESTAMP":
      return "DATETIME2";
    case "DECIMAL":
      return "DECIMAL(10,2)";
    default:
      return type;
  }
}

/**
 * Adapt SQL types for PostgreSQL dialect (default, no changes needed)
 */
function adaptTypeForPostgreSQL(type: string): string {
  return type;
}
