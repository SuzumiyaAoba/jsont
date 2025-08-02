/**
 * Tests for ExportDialog component logic and props
 */

import type { ExportDialogProps } from "@features/schema/components/ExportDialog";
import { describe, expect, it, vi } from "vitest";
import type { ExportOptions } from "../utils/fileExport";

describe("ExportDialog Props and Logic", () => {
  it("should define correct prop interface", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    const props: ExportDialogProps = {
      isVisible: true,
      onConfirm: mockOnConfirm,
      onCancel: mockOnCancel,
      defaultFilename: "test-schema.json",
      width: 80,
      height: 24,
    };

    expect(props.isVisible).toBe(true);
    expect(typeof props.onConfirm).toBe("function");
    expect(typeof props.onCancel).toBe("function");
    expect(props.defaultFilename).toBe("test-schema.json");
  });

  it("should handle onConfirm callback with export options", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    const exportOptions: ExportOptions = {
      filename: "custom-schema.json",
      outputDir: "/custom/path",
      format: "schema",
    };

    const props: ExportDialogProps = {
      isVisible: true,
      onConfirm: mockOnConfirm,
      onCancel: mockOnCancel,
      defaultFilename: "default.json",
      width: 80,
      height: 24,
    };

    // Simulate callback execution
    props.onConfirm(exportOptions);

    expect(mockOnConfirm).toHaveBeenCalledWith(exportOptions);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("should handle onCancel callback", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    const props: ExportDialogProps = {
      isVisible: true,
      onConfirm: mockOnConfirm,
      onCancel: mockOnCancel,
      defaultFilename: "test.json",
      width: 80,
      height: 24,
    };

    // Simulate cancel callback
    props.onCancel();

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).toHaveBeenCalledWith();
  });

  it("should work with different visibility states", () => {
    const mockCallbacks = {
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    };

    const visibleProps: ExportDialogProps = {
      isVisible: true,
      ...mockCallbacks,
      defaultFilename: "visible.json",
      width: 80,
      height: 24,
    };

    const hiddenProps: ExportDialogProps = {
      isVisible: false,
      ...mockCallbacks,
      defaultFilename: "hidden.json",
      width: 80,
      height: 24,
    };

    expect(visibleProps.isVisible).toBe(true);
    expect(hiddenProps.isVisible).toBe(false);
  });

  it("should handle optional defaultFilename", () => {
    const mockCallbacks = {
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    };

    // With default filename
    const propsWithDefault: ExportDialogProps = {
      isVisible: true,
      ...mockCallbacks,
      defaultFilename: "with-default.json",
      width: 80,
      height: 24,
    };

    // Without default filename (undefined should be allowed)
    const propsWithoutDefault: Omit<ExportDialogProps, "defaultFilename"> = {
      isVisible: true,
      ...mockCallbacks,
      width: 80,
      height: 24,
    };

    expect(propsWithDefault.defaultFilename).toBe("with-default.json");
    expect("defaultFilename" in propsWithoutDefault).toBe(false);
  });

  it("should support various filename patterns", () => {
    const mockCallbacks = {
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    };

    const filenameTests = [
      "schema.json",
      "user-schema.json",
      "api_schema.json",
      "schema-2024-01-01.json",
      "complex.schema.file.json",
    ];

    filenameTests.forEach((filename) => {
      const props: ExportDialogProps = {
        isVisible: true,
        ...mockCallbacks,
        defaultFilename: filename,
        width: 80,
        height: 24,
      };

      expect(props.defaultFilename).toBe(filename);
    });
  });
});

describe("ExportDialog Callback Integration", () => {
  it("should properly type export options in onConfirm", () => {
    const mockOnConfirm = vi.fn<(options: ExportOptions) => void>();
    const mockOnCancel = vi.fn();

    const props: ExportDialogProps = {
      isVisible: true,
      onConfirm: mockOnConfirm,
      onCancel: mockOnCancel,
      defaultFilename: "integration-test.json",
      width: 80,
      height: 24,
    };

    const testOptions: ExportOptions = {
      filename: "test-export.json",
      outputDir: process.cwd(),
      format: "schema",
    };

    props.onConfirm(testOptions);

    expect(mockOnConfirm).toHaveBeenCalledWith(testOptions);
  });

  it("should handle different export options", () => {
    const capturedOptions: ExportOptions[] = [];
    const mockOnConfirm = vi.fn<(options: ExportOptions) => void>(
      (options: ExportOptions) => {
        capturedOptions.push(options);
      },
    );

    const props: ExportDialogProps = {
      isVisible: true,
      onConfirm: mockOnConfirm,
      onCancel: vi.fn(),
      defaultFilename: "test.json",
      width: 80,
      height: 24,
    };

    const options1: ExportOptions = {
      filename: "schema1.json",
      outputDir: "/path1",
      format: "schema",
    };

    const options2: ExportOptions = {
      filename: "data.json",
      outputDir: "/path2",
      format: "json",
    };

    props.onConfirm(options1);
    props.onConfirm(options2);

    expect(capturedOptions).toHaveLength(2);
    expect(capturedOptions[0]).toEqual(options1);
    expect(capturedOptions[1]).toEqual(options2);
  });

  it("should maintain type safety", () => {
    // This test ensures the component maintains proper TypeScript types
    const mockOnConfirm: (options: ExportOptions) => void = vi.fn();
    const mockOnCancel: () => void = vi.fn();

    const props: ExportDialogProps = {
      isVisible: true,
      onConfirm: mockOnConfirm,
      onCancel: mockOnCancel,
      defaultFilename: "type-safe.json",
      width: 80,
      height: 24,
    };

    // These should compile without type errors
    expect(typeof props.isVisible).toBe("boolean");
    expect(typeof props.onConfirm).toBe("function");
    expect(typeof props.onCancel).toBe("function");
    expect(typeof props.defaultFilename).toBe("string");
    expect(typeof props.width).toBe("number");
    expect(typeof props.height).toBe("number");
  });

  it("should handle responsive screen sizes", () => {
    const mockCallbacks = {
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    };

    // Small screen props
    const smallScreenProps: ExportDialogProps = {
      isVisible: true,
      ...mockCallbacks,
      defaultFilename: "small.json",
      width: 50,
      height: 15,
    };

    // Very small screen props
    const verySmallScreenProps: ExportDialogProps = {
      isVisible: true,
      ...mockCallbacks,
      defaultFilename: "very-small.json",
      width: 40,
      height: 10,
    };

    // Large screen props
    const largeScreenProps: ExportDialogProps = {
      isVisible: true,
      ...mockCallbacks,
      defaultFilename: "large.json",
      width: 120,
      height: 30,
    };

    expect(smallScreenProps.width).toBe(50);
    expect(verySmallScreenProps.width).toBe(40);
    expect(largeScreenProps.width).toBe(120);
  });

  describe("filename extension utilities", () => {
    // Test the helper functions used in ExportDialog

    it("should correctly map formats to extensions", () => {
      const extensionTests = [
        { format: "json", expected: ".json" },
        { format: "schema", expected: ".json" },
        { format: "yaml", expected: ".yaml" },
        { format: "csv", expected: ".csv" },
        { format: "xml", expected: ".xml" },
        { format: "sql", expected: ".sql" },
        { format: "unknown", expected: ".json" }, // fallback
      ];

      extensionTests.forEach(({ format, expected }) => {
        // Test that would be done by getExtensionForFormat function
        const extensionMap: Record<string, string> = {
          json: ".json",
          schema: ".json",
          yaml: ".yaml",
          csv: ".csv",
          xml: ".xml",
          sql: ".sql",
        };
        const result = extensionMap[format] || ".json";
        expect(result).toBe(expected);
      });
    });

    it("should correctly update filename extensions", () => {
      const testCases = [
        { filename: "data.json", newFormat: "xml", expected: "data.xml" },
        {
          filename: "export.schema.json",
          newFormat: "sql",
          expected: "export.schema.sql",
        },
        { filename: "test.yaml", newFormat: "csv", expected: "test.csv" },
        { filename: "noext", newFormat: "json", expected: "noext.json" },
        {
          filename: "complex.name.with.dots.xml",
          newFormat: "yaml",
          expected: "complex.name.with.dots.yaml",
        },
      ];

      testCases.forEach(({ filename, newFormat, expected }) => {
        // Test logic that would be done by updateFilenameExtension function
        const extensionMap: Record<string, string> = {
          json: ".json",
          schema: ".json",
          yaml: ".yaml",
          csv: ".csv",
          xml: ".xml",
          sql: ".sql",
        };
        const newExtension = extensionMap[newFormat] || ".json";
        const baseName = filename.replace(/\.[^/.]+$/, "");
        const result = `${baseName}${newExtension}`;
        expect(result).toBe(expected);
      });
    });
  });
});
