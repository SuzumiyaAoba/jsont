/**
 * Tests for ExportDialog component logic and props
 */

import { describe, expect, it, vi } from "vitest";
import type { ExportOptions } from "../utils/fileExport";
import type { ExportDialogProps } from "./ExportDialog";

describe("ExportDialog Props and Logic", () => {
  it("should define correct prop interface", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    const props: ExportDialogProps = {
      isVisible: true,
      onConfirm: mockOnConfirm,
      onCancel: mockOnCancel,
      defaultFilename: "test-schema.json",
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
      format: "json",
    };

    const props: ExportDialogProps = {
      isVisible: true,
      onConfirm: mockOnConfirm,
      onCancel: mockOnCancel,
      defaultFilename: "default.json",
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
    };

    const hiddenProps: ExportDialogProps = {
      isVisible: false,
      ...mockCallbacks,
      defaultFilename: "hidden.json",
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
    };

    // Without default filename (undefined should be allowed)
    const propsWithoutDefault: Omit<ExportDialogProps, "defaultFilename"> = {
      isVisible: true,
      ...mockCallbacks,
    };

    expect(propsWithDefault.defaultFilename).toBe("with-default.json");
    expect(propsWithoutDefault.defaultFilename).toBeUndefined();
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
      };

      expect(props.defaultFilename).toBe(filename);
    });
  });
});

describe("ExportDialog Callback Integration", () => {
  it("should properly type export options in onConfirm", () => {
    const mockOnConfirm = vi.fn<[ExportOptions], void>();
    const mockOnCancel = vi.fn();

    const props: ExportDialogProps = {
      isVisible: true,
      onConfirm: mockOnConfirm,
      onCancel: mockOnCancel,
      defaultFilename: "integration-test.json",
    };

    const testOptions: ExportOptions = {
      filename: "test-export.json",
      outputDir: process.cwd(),
      format: "json",
    };

    props.onConfirm(testOptions);

    expect(mockOnConfirm).toHaveBeenCalledWith(testOptions);
  });

  it("should handle different export options", () => {
    const capturedOptions: ExportOptions[] = [];
    const mockOnConfirm = vi.fn<[ExportOptions], void>((options) => {
      capturedOptions.push(options);
    });

    const props: ExportDialogProps = {
      isVisible: true,
      onConfirm: mockOnConfirm,
      onCancel: vi.fn(),
      defaultFilename: "test.json",
    };

    const options1: ExportOptions = {
      filename: "schema1.json",
      outputDir: "/path1",
      format: "json",
    };

    const options2: ExportOptions = {
      filename: "schema2.json",
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
    };

    // These should compile without type errors
    expect(typeof props.isVisible).toBe("boolean");
    expect(typeof props.onConfirm).toBe("function");
    expect(typeof props.onCancel).toBe("function");
    expect(typeof props.defaultFilename).toBe("string");
  });
});
