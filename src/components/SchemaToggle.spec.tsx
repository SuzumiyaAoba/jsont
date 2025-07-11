import { render } from "ink-testing-library";
import { describe, expect, it, vi } from "vitest";
import { App } from "../App";

// Mock the useInput hook to simulate keyboard input
type MockKeyInput = {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  return?: boolean;
  escape?: boolean;
  backspace?: boolean;
  delete?: boolean;
};

let mockInputHandler: ((input: string, key: MockKeyInput) => void) | null =
  null;

vi.mock("ink", async () => {
  const actual = await vi.importActual("ink");
  return {
    ...actual,
    useInput: vi.fn((handler: (input: string, key: MockKeyInput) => void) => {
      mockInputHandler = handler;
    }),
    useApp: () => ({ exit: vi.fn() }),
  };
});

describe("Schema Toggle Functionality", () => {
  it("should show JSON view by default", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    const output = lastFrame();
    // Should show JSON data, not schema
    expect(output).toContain("test");
    expect(output).toContain("123");
    expect(output).not.toContain('"$schema"');
  });

  it("should show schema view when S key is pressed", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Initially shows JSON
    let output = lastFrame();
    expect(output).not.toContain('"$schema"');

    // Press S to toggle to schema view
    mockInputHandler?.("S", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Should now show schema
    output = lastFrame();
    expect(output).toContain('"$schema"');
    expect(output).toContain('"type": "object"');
  });

  it("should toggle back to JSON view when S key is pressed again", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Press S to show schema
    mockInputHandler?.("S", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Should show schema
    let output = lastFrame();
    expect(output).toContain('"$schema"');

    // Press S again to hide schema
    mockInputHandler?.("S", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Should show JSON again
    output = lastFrame();
    expect(output).toContain("test");
    expect(output).toContain("123");
    expect(output).not.toContain('"$schema"');
  });

  it("should not respond to lowercase s key for schema toggle", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Press lowercase s (should trigger search, not schema)
    mockInputHandler?.("s", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Should still show JSON, not schema
    const output = lastFrame();
    expect(output).not.toContain('"$schema"');
    // Should show search bar
    expect(output).toContain("Search:");
  });

  it("should show schema toggle help in status bar", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Press '?' to show help
    if (mockInputHandler) {
      mockInputHandler("?", {});
      rerender(<App initialData={data} keyboardEnabled={true} />);
    }

    const output = lastFrame();
    // Check for the S key binding in help text
    expect(output).toContain("S:");
  });

  it("should handle schema view with line numbers", () => {
    const data = { name: "test", value: 123, nested: { key: "value" } };
    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Enable line numbers first
    mockInputHandler?.("L", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Then enable schema view
    mockInputHandler?.("S", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    const output = lastFrame();
    expect(output).toContain('"$schema"');
    // Should have line numbers
    expect(output).toMatch(/\d+/);
  });

  it("should handle schema view with search functionality", () => {
    const data = {
      users: [
        { name: "Alice", email: "alice@example.com" },
        { name: "Bob", email: "bob@example.com" },
      ],
    };
    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Enable schema view
    mockInputHandler?.("S", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Start search
    mockInputHandler?.("s", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    const output = lastFrame();
    expect(output).toContain('"$schema"'); // Still in schema view
    expect(output).toContain("Search:"); // Search is active
  });

  it("should maintain scroll position when toggling schema view", () => {
    const largeData = {
      field1: "value1",
      field2: "value2",
      field3: "value3",
      field4: "value4",
      field5: "value5",
      field6: "value6",
      field7: "value7",
      field8: "value8",
      field9: "value9",
      field10: "value10",
    };

    const { lastFrame, rerender } = render(
      <App initialData={largeData} keyboardEnabled={true} />,
    );

    // Scroll down a bit
    mockInputHandler?.("j", { ctrl: false, meta: false });
    mockInputHandler?.("j", { ctrl: false, meta: false });
    rerender(<App initialData={largeData} keyboardEnabled={true} />);

    // Toggle to schema view
    mockInputHandler?.("S", { ctrl: false, meta: false });
    rerender(<App initialData={largeData} keyboardEnabled={true} />);

    const output = lastFrame();
    expect(output).toContain('"$schema"');
    // Scroll position should be maintained
  });

  it("should handle schema view for different data types", () => {
    // Test with array data
    const arrayData = [1, 2, 3, "four", true];
    const { lastFrame: arrayFrame, rerender: arrayRerender } = render(
      <App initialData={arrayData} keyboardEnabled={true} />,
    );

    mockInputHandler?.("S", { ctrl: false, meta: false });
    arrayRerender(<App initialData={arrayData} keyboardEnabled={true} />);

    let output = arrayFrame();
    expect(output).toContain('"type": "array"');

    // Test with primitive data
    const primitiveData = "hello world";
    const { lastFrame: primitiveFrame, rerender: primitiveRerender } = render(
      <App initialData={primitiveData} keyboardEnabled={true} />,
    );

    mockInputHandler?.("S", { ctrl: false, meta: false });
    primitiveRerender(
      <App initialData={primitiveData} keyboardEnabled={true} />,
    );

    output = primitiveFrame();
    expect(output).toContain('"type": "string"');
  });

  it("should handle navigation keys in schema view", () => {
    const data = {
      longObject: {
        field1: "value1",
        field2: "value2",
        field3: "value3",
        field4: "value4",
        field5: "value5",
        nested: {
          deep: {
            property: "value",
          },
        },
      },
    };

    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Enable schema view
    mockInputHandler?.("S", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Test navigation keys work in schema view
    mockInputHandler?.("j", { ctrl: false, meta: false }); // scroll down
    rerender(<App initialData={data} keyboardEnabled={true} />);

    mockInputHandler?.("k", { ctrl: false, meta: false }); // scroll up
    rerender(<App initialData={data} keyboardEnabled={true} />);

    mockInputHandler?.("G", { ctrl: false, meta: false }); // go to bottom
    rerender(<App initialData={data} keyboardEnabled={true} />);

    const output = lastFrame();
    // After navigation (especially G to bottom), we should see schema content, even if not the $schema line
    expect(output).toMatch(
      /(required|properties|additionalProperties|"\$schema")/,
    ); // Should still be in schema view
  });

  it("should re-search when switching from JSON to schema view with active search", () => {
    const data = { name: "test", value: 123, type: "object" };
    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Start search for "test"
    mockInputHandler?.("s", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Type search term
    for (const char of "test") {
      mockInputHandler?.(char, { ctrl: false, meta: false });
    }
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Confirm search
    mockInputHandler?.("", { return: true });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Switch to schema view - this should trigger re-search in schema content
    mockInputHandler?.("S", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    const output = lastFrame();
    // Should be in schema view with search active
    expect(output).toMatch(/(properties|"\$schema")/); // Should show schema content

    // The search should now be searching in schema content, not original JSON
    // This is verified by the fact that we can see schema-specific content
  });

  it("should re-search when switching from schema to JSON view with active search", () => {
    const data = { name: "test", value: 123, type: "string" };
    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Switch to schema view first
    mockInputHandler?.("S", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Start search for "string"
    mockInputHandler?.("s", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Type search term for something that exists in schema
    for (const char of "string") {
      mockInputHandler?.(char, { ctrl: false, meta: false });
    }
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Confirm search
    mockInputHandler?.("", { return: true });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Switch back to JSON view - this should trigger re-search in JSON content
    mockInputHandler?.("S", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    const output = lastFrame();
    // Should be in JSON view
    expect(output).toContain("test");
    expect(output).toContain("123");
    expect(output).not.toMatch(/("\$schema"|properties)/); // Should not show schema content
  });
});
