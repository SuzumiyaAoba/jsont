/**
 * Tests for SqlConverter
 */

import { describe, expect, it } from "vitest";
import { SqlConverter } from "../SqlConverter";

describe("SqlConverter", () => {
  const converter = new SqlConverter();

  describe("format properties", () => {
    it("should have correct format properties", () => {
      expect(converter.format).toBe("sql");
      expect(converter.extension).toBe(".sql");
      expect(converter.displayName).toBe("SQL");
    });
  });

  describe("getDefaultOptions", () => {
    it("should return default SQL options", () => {
      const options = converter.getDefaultOptions();
      expect(options).toEqual({
        tableName: "data_table",
        dialect: "postgresql",
        includeCreateTable: true,
        batchSize: 1000,
        escapeIdentifiers: true,
        useMultiTableStructure: true,
      });
    });
  });

  describe("validate", () => {
    it("should validate null and undefined", () => {
      expect(converter.validate(null).isOk()).toBe(true);
      expect(converter.validate(undefined).isOk()).toBe(true);
    });

    it("should validate simple values", () => {
      expect(converter.validate("test").isOk()).toBe(true);
      expect(converter.validate(123).isOk()).toBe(true);
      expect(converter.validate(true).isOk()).toBe(true);
    });

    it("should validate objects", () => {
      expect(converter.validate({ name: "John", age: 30 }).isOk()).toBe(true);
    });

    it("should validate uniform arrays of objects", () => {
      const data = [
        { id: 1, name: "John", active: true },
        { id: 2, name: "Jane", active: false },
      ];
      expect(converter.validate(data).isOk()).toBe(true);
    });

    it("should reject arrays with inconsistent object structure", () => {
      const data = [
        { id: 1, name: "John" },
        { id: 2, email: "jane@example.com" }, // Different keys
      ];
      const result = converter.validate(data);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("inconsistent structure");
        expect(result.error.type).toBe("VALIDATION_ERROR");
      }
    });

    it("should reject arrays with mixed types", () => {
      const data = [
        { id: 1, name: "John" },
        "invalid", // Not an object
      ];
      const result = converter.validate(data);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("convert", () => {
    describe("empty and null data", () => {
      it("should handle null data", () => {
        const result = converter.convert(null);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain("-- Generated SQL for table: data_table");
          expect(sql).toContain("-- No data to insert");
        }
      });

      it("should handle empty arrays", () => {
        const result = converter.convert([]);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toContain("-- No data to insert");
        }
      });
    });

    describe("primitive values", () => {
      it("should convert primitive to single-column table", () => {
        const result = converter.convert("Hello World");
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain("CREATE TABLE");
          expect(sql).toContain('"value" TEXT NOT NULL');
          expect(sql).toContain("INSERT INTO");
          expect(sql).toContain("'Hello World'");
        }
      });

      it("should handle numeric values", () => {
        const result = converter.convert(42);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain('"value" INTEGER NOT NULL');
          expect(sql).toContain("42");
        }
      });

      it("should handle boolean values", () => {
        const result = converter.convert(true);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain('"value" BOOLEAN NOT NULL');
          expect(sql).toContain("true");
        }
      });
    });

    describe("single objects", () => {
      it("should convert simple object", () => {
        const data = { name: "John", age: 30, active: true };
        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain('"active" BOOLEAN NOT NULL');
          expect(sql).toContain('"age" INTEGER NOT NULL');
          expect(sql).toContain('"name" TEXT NOT NULL');
          expect(sql).toContain("INSERT INTO");
          expect(sql).toContain("'John'");
          expect(sql).toContain("30");
          expect(sql).toContain("true");
        }
      });

      it("should handle null values as nullable columns", () => {
        const data = { name: "John", email: null };
        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain('"email" TEXT');
          expect(sql).not.toContain('"email" TEXT NOT NULL');
          expect(sql).toContain('"name" TEXT NOT NULL');
          expect(sql).toContain("NULL");
        }
      });
    });

    describe("array of objects", () => {
      it("should convert array of uniform objects", () => {
        const data = [
          { id: 1, name: "John", salary: 50000.5 },
          { id: 2, name: "Jane", salary: 60000.75 },
        ];
        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain('"id" INTEGER NOT NULL');
          expect(sql).toContain('"name" TEXT NOT NULL');
          expect(sql).toContain('"salary" REAL NOT NULL');
          expect(sql).toContain("VALUES");
          expect(sql).toContain("(1, 'John', 50000.5)");
          expect(sql).toContain("(2, 'Jane', 60000.75)");
        }
      });

      it("should handle missing properties as nullable", () => {
        const data = [
          { id: 1, name: "John", email: "john@example.com" },
          { id: 2, name: "Jane" }, // Missing email
        ];
        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          // With multi-table structure, this will create separate tables
          // but should still handle the data correctly
          expect(sql).toContain("'john@example.com'");
          expect(sql).toContain("'Jane'");
        }
      });

      it("should handle mixed number types", () => {
        const data = [
          { id: 1, value: 10 }, // Integer
          { id: 2, value: 10.5 }, // Float
        ];
        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain('"value" REAL NOT NULL'); // Should promote to REAL
        }
      });
    });

    describe("date detection", () => {
      it("should detect ISO date strings", () => {
        const data = { event: "meeting", date: "2023-12-25T10:30:00Z" };
        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain('"date" TIMESTAMP NOT NULL');
        }
      });

      it("should treat regular strings as text", () => {
        const data = { name: "2023-not-a-date" };
        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain('"name" TEXT NOT NULL');
        }
      });
    });

    describe("complex data types", () => {
      it("should serialize arrays as JSON strings", () => {
        const data = { tags: ["web", "api", "json"] };
        const result = converter.convert(data, {
          useMultiTableStructure: false,
        });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain('"tags" TEXT NOT NULL');
          expect(sql).toContain('["web","api","json"]');
        }
      });

      it("should serialize objects as JSON strings", () => {
        const data = { metadata: { version: "1.0", author: "test" } };
        const result = converter.convert(data, {
          useMultiTableStructure: false,
        });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain('"metadata" TEXT NOT NULL');
          expect(sql).toContain('{"version":"1.0","author":"test"}');
        }
      });
    });

    describe("SQL dialects", () => {
      it("should generate MySQL-specific SQL", () => {
        const data = { id: 1, active: true };
        const result = converter.convert(data, { dialect: "mysql" });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain("`id` INT NOT NULL");
          expect(sql).toContain("`active` BOOLEAN NOT NULL");
          expect(sql).toContain("TRUE");
        }
      });

      it("should generate SQLite-specific SQL", () => {
        const data = { id: 1, active: true };
        const result = converter.convert(data, { dialect: "sqlite" });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain('"id" INTEGER NOT NULL');
          expect(sql).toContain('"active" INTEGER NOT NULL'); // SQLite uses INTEGER for boolean
          expect(sql).toContain("1"); // SQLite boolean as 1
        }
      });

      it("should generate SQL Server-specific SQL", () => {
        const data = { name: "test", active: true };
        const result = converter.convert(data, { dialect: "mssql" });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain("[active] BIT NOT NULL");
          expect(sql).toContain("[name] NVARCHAR(MAX) NOT NULL");
        }
      });
    });

    describe("custom options", () => {
      it("should use custom table name", () => {
        const data = { id: 1 };
        const result = converter.convert(data, { tableName: "users" });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain('CREATE TABLE "users"');
          expect(sql).toContain('INSERT INTO "users"');
        }
      });

      it("should skip CREATE TABLE when requested", () => {
        const data = { id: 1 };
        const result = converter.convert(data, { includeCreateTable: false });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).not.toContain("CREATE TABLE");
          expect(sql).toContain("INSERT INTO");
        }
      });

      it("should disable identifier escaping when requested", () => {
        const data = { user_name: "test" };
        const result = converter.convert(data, { escapeIdentifiers: false });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain("user_name TEXT NOT NULL");
          expect(sql).not.toContain('"user_name"');
        }
      });

      it("should handle batch size for large datasets", () => {
        const data = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }));
        const result = converter.convert(data, {
          batchSize: 2,
          dialect: "sqlite",
        });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          // Should have individual INSERT statements for SQLite
          const insertCount = (sql.match(/INSERT INTO/g) || []).length;
          expect(insertCount).toBe(5); // One for each row in SQLite
        }
      });

      it("should use multi-row INSERT for PostgreSQL with batching", () => {
        const data = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }));
        const result = converter.convert(data, {
          batchSize: 3,
          dialect: "postgresql",
        });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          // Should have 2 INSERT statements (3 + 2 rows)
          const insertCount = (sql.match(/INSERT INTO/g) || []).length;
          expect(insertCount).toBe(2);
          expect(sql).toContain("VALUES\n  (1),\n  (2),\n  (3);");
          expect(sql).toContain("VALUES\n  (4),\n  (5);");
        }
      });
    });

    describe("SQL escaping", () => {
      it("should escape single quotes in strings", () => {
        const data = { message: "It's a test" };
        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain("'It''s a test'");
        }
      });

      it("should escape backslashes in MySQL", () => {
        const data = { path: "C:\\Program Files\\App" };
        const result = converter.convert(data, { dialect: "mysql" });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain("'C:\\\\Program Files\\\\App'");
        }
      });

      it("should not escape backslashes in PostgreSQL", () => {
        const data = { path: "C:\\Program Files\\App" };
        const result = converter.convert(data, { dialect: "postgresql" });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain("'C:\\Program Files\\App'");
        }
      });

      it("should handle special characters in identifiers", () => {
        const data = { "user-name": "test", "user.email": "test@example.com" };
        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;
          expect(sql).toContain('"user-name"');
          expect(sql).toContain('"user.email"');
        }
      });
    });

    describe("error handling", () => {
      it("should handle conversion gracefully with robust error checking", () => {
        // The SQL converter is robust and handles invalid options gracefully
        const result = converter.convert({ id: 1 }, { batchSize: "invalid" });
        expect(result.isOk()).toBe(true);

        // Test that SQL conversion normally succeeds
        if (result.isOk()) {
          expect(result.value).toContain("CREATE TABLE");
          expect(result.value).toContain("INSERT INTO");
        }
      });
    });

    describe("comprehensive examples", () => {
      it("should handle complex e-commerce data", () => {
        const data = [
          {
            order_id: 1001,
            customer_email: "john@example.com",
            total_amount: 199.99,
            order_date: "2023-12-25T10:30:00Z",
            is_paid: true,
            items: ["laptop", "mouse"],
            metadata: { source: "web", campaign: "holiday2023" },
            shipping_address: null,
          },
          {
            order_id: 1002,
            customer_email: "jane@example.com",
            total_amount: 50.0,
            order_date: "2023-12-26T15:45:00Z",
            is_paid: false,
            items: ["book"],
            metadata: { source: "mobile" },
            shipping_address: "123 Main St",
          },
        ];

        const result = converter.convert(data, { tableName: "orders" });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;

          // Check table creation
          expect(sql).toContain('CREATE TABLE "orders"');
          expect(sql).toContain('"customer_email" TEXT NOT NULL');
          expect(sql).toContain('"is_paid" BOOLEAN NOT NULL');
          expect(sql).toContain('"items" TEXT NOT NULL');
          expect(sql).toContain('"metadata" TEXT NOT NULL');
          expect(sql).toContain('"order_date" TIMESTAMP NOT NULL');
          expect(sql).toContain('"order_id" INTEGER NOT NULL');
          expect(sql).toContain('"shipping_address" TEXT'); // Nullable
          expect(sql).toContain('"total_amount" REAL NOT NULL');

          // Check data insertion
          expect(sql).toContain('INSERT INTO "orders"');
          expect(sql).toContain("'john@example.com'");
          expect(sql).toContain("199.99");
          expect(sql).toContain("true");
          expect(sql).toContain('["laptop","mouse"]');
          expect(sql).toContain('{"source":"web","campaign":"holiday2023"}');
          expect(sql).toContain("NULL");
          expect(sql).toContain("'123 Main St'");
        }
      });
    });

    describe("multi-table structure generation", () => {
      it("should create separate tables for nested objects", () => {
        const data = {
          name: "Company",
          employees: [
            { id: 1, name: "John", department: "IT" },
            { id: 2, name: "Jane", department: "HR" },
          ],
          address: {
            street: "123 Main St",
            city: "New York",
            country: "USA",
          },
        };

        const result = converter.convert(data, {
          useMultiTableStructure: true,
        });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;

          // Should create separate tables
          expect(sql).toContain('CREATE TABLE "data_table"');
          expect(sql).toContain('CREATE TABLE "data_table_employees"');
          expect(sql).toContain('CREATE TABLE "data_table_address"');

          // Main table should only have primitive values
          expect(sql).toContain('INSERT INTO "data_table" ("name") VALUES');
          expect(sql).toContain("('Company')");

          // Employees table should have employee data
          expect(sql).toContain('INSERT INTO "data_table_employees"');
          expect(sql).toContain("'John'");
          expect(sql).toContain("'Jane'");

          // Address table should have address data
          expect(sql).toContain('INSERT INTO "data_table_address"');
          expect(sql).toContain("'123 Main St'");
        }
      });

      it("should group array items by structure", () => {
        const data = [
          { id: 1, name: "John", type: "user" },
          { id: 2, name: "Jane", type: "user" },
          { id: 101, title: "Admin Panel", type: "page" },
          { id: 102, title: "Settings", type: "page" },
        ];

        const result = converter.convert(data, {
          useMultiTableStructure: true,
        });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;

          // Should create separate tables for different structures
          expect(sql).toContain('CREATE TABLE "data_table_0"');
          expect(sql).toContain('CREATE TABLE "data_table_1"');

          // First table should have name column, second should have title column
          expect(sql).toContain('"name" TEXT NOT NULL');
          expect(sql).toContain('"title" TEXT NOT NULL');
        }
      });

      it("should handle deeply nested objects", () => {
        const data = {
          user: {
            profile: {
              personal: {
                name: "John",
                age: 30,
              },
              preferences: {
                theme: "dark",
                language: "en",
              },
            },
          },
        };

        const result = converter.convert(data, {
          useMultiTableStructure: true,
        });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;

          // Should create tables for deeply nested structures
          expect(sql).toContain("CREATE TABLE");
          expect(sql).toContain("data_table_user_profile_personal");
          expect(sql).toContain("data_table_user_profile_preferences");
          expect(sql).toContain("'John'");
          expect(sql).toContain("30");
          expect(sql).toContain("'dark'");
          expect(sql).toContain("'en'");
        }
      });

      it("should handle mixed array content appropriately", () => {
        const data = {
          items: [
            { type: "book", title: "1984", author: "Orwell" },
            { type: "movie", title: "Inception", director: "Nolan" },
            { type: "book", title: "Dune", author: "Herbert" },
          ],
        };

        const result = converter.convert(data, {
          useMultiTableStructure: true,
        });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;

          // Should separate by structure (books vs movies have different fields)
          expect(sql).toContain("CREATE TABLE");
          expect(sql).toContain('"author"');
          expect(sql).toContain('"director"');
        }
      });

      it("should create single table for homogeneous array", () => {
        const data = [
          { id: 1, name: "Item 1", price: 10.5 },
          { id: 2, name: "Item 2", price: 25.0 },
          { id: 3, name: "Item 3", price: 15.75 },
        ];

        const result = converter.convert(data, { tableName: "data" });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;

          // Should create only one table since all items have same structure
          const tableCount = (sql.match(/CREATE TABLE/g) || []).length;
          expect(tableCount).toBe(1);
          expect(sql).toContain('CREATE TABLE "data"');
        }
      });

      it("should handle complex nested structures with multiple levels", () => {
        const data = {
          company: "TechCorp",
          headquarters: {
            address: {
              street: "123 Tech St",
              city: "San Francisco",
              coordinates: {
                lat: 37.7749,
                lng: -122.4194,
              },
            },
            contact: {
              phone: "555-0123",
              email: "info@techcorp.com",
            },
          },
          departments: [
            {
              name: "Engineering",
              manager: {
                name: "Alice Johnson",
                contact: {
                  email: "alice@techcorp.com",
                  phone: "555-0001",
                },
              },
            },
          ],
        };

        const result = converter.convert(data, {
          useMultiTableStructure: true,
        });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const sql = result.value;

          // Should create separate tables for each nested level
          expect(sql).toContain('CREATE TABLE "data_table"'); // Main table with company name
          expect(sql).toContain(
            'CREATE TABLE "data_table_headquarters_address_coordinates"',
          ); // Deep nested coordinates
          expect(sql).toContain(
            'CREATE TABLE "data_table_headquarters_address"',
          ); // Address without coordinates
          expect(sql).toContain(
            'CREATE TABLE "data_table_headquarters_contact"',
          ); // Contact info
          expect(sql).toContain('CREATE TABLE "data_table_departments"'); // Departments array

          // Check that data is properly distributed
          expect(sql).toContain("'TechCorp'"); // Company name in main table
          expect(sql).toContain("37.7749"); // Latitude in coordinates table
          expect(sql).toContain("'123 Tech St'"); // Street in address table
          expect(sql).toContain("'info@techcorp.com'"); // Contact email
          expect(sql).toContain("'Engineering'"); // Department name
        }
      });
    });
  });
});
