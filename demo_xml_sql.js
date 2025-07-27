#!/usr/bin/env node

/**
 * Demo script for new XML and SQL export formats
 */

import { SqlConverter } from "./dist/core/utils/dataConverters/SqlConverter.js";
import { XmlConverter } from "./dist/core/utils/dataConverters/XmlConverter.js";

// Sample data for demonstration
const sampleData = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    age: 30,
    active: true,
    last_login: "2023-12-25T10:30:00Z",
    tags: ["developer", "javascript"],
    metadata: { department: "engineering", level: "senior" },
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    age: 28,
    active: false,
    last_login: "2023-12-20T15:45:00Z",
    tags: ["designer", "ui"],
    metadata: { department: "design", level: "mid" },
  },
];

console.log("🎯 XML and SQL Export Demo\n");

// XML Conversion Demo
console.log("📄 XML Export:");
console.log("=".repeat(50));

const xmlConverter = new XmlConverter();
const xmlResult = xmlConverter.convert(sampleData, {
  rootElement: "users",
  arrayItemElement: "user",
  indent: 2,
});

if (xmlResult.isOk()) {
  console.log(xmlResult.value);
} else {
  console.error("XML conversion failed:", xmlResult.error);
}

console.log("\n");

// SQL Conversion Demo
console.log("🗄️ SQL Export (PostgreSQL):");
console.log("=".repeat(50));

const sqlConverter = new SqlConverter();
const sqlResult = sqlConverter.convert(sampleData, {
  tableName: "users",
  dialect: "postgresql",
  includeCreateTable: true,
  batchSize: 10,
});

if (sqlResult.isOk()) {
  console.log(sqlResult.value);
} else {
  console.error("SQL conversion failed:", sqlResult.error);
}

console.log("\n");

// SQL Conversion Demo - MySQL dialect
console.log("🗄️ SQL Export (MySQL):");
console.log("=".repeat(50));

const mysqlResult = sqlConverter.convert(sampleData, {
  tableName: "users",
  dialect: "mysql",
  includeCreateTable: true,
  escapeIdentifiers: true,
});

if (mysqlResult.isOk()) {
  console.log(mysqlResult.value);
} else {
  console.error("MySQL conversion failed:", mysqlResult.error);
}
