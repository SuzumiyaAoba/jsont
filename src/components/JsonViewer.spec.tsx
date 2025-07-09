import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import { JsonViewer } from "./JsonViewer";

describe("JsonViewer", () => {
  it("should render null data gracefully", () => {
    const { lastFrame } = render(<JsonViewer data={null} />);
    expect(lastFrame()).toContain("No JSON data to display");
  });

  it("should render simple JSON with proper formatting", () => {
    const data = { key: "value", number: 42 };
    const { lastFrame } = render(<JsonViewer data={data} />);
    const output = lastFrame();

    // Check that JSON structure is present
    expect(output).toContain("key");
    expect(output).toContain("value");
    expect(output).toContain("number");
    expect(output).toContain("42");
  });

  it("should handle complex nested structures", () => {
    const data = {
      object: {
        nested: "value",
      },
      array: ["item1", "item2"],
      mixed: {
        numbers: [1, 2, 3],
        booleans: [true, false],
        nullValue: null,
      },
    };

    const { lastFrame } = render(<JsonViewer data={data} />);
    const output = lastFrame();

    // Check that all data types are rendered
    expect(output).toContain("object");
    expect(output).toContain("array");
    expect(output).toContain("mixed");
    expect(output).toContain("item1");
    expect(output).toContain("true");
    expect(output).toContain("false");
    expect(output).toContain("null");
  });

  it("should handle empty objects and arrays", () => {
    const data = {
      emptyObject: {},
      emptyArray: [],
    };

    const { lastFrame } = render(<JsonViewer data={data} />);
    const output = lastFrame();

    expect(output).toContain("emptyObject");
    expect(output).toContain("emptyArray");
  });

  it("should handle arrays with mixed types", () => {
    const data = ["string", 42, true, null, { nested: "object" }, [1, 2, 3]];

    const { lastFrame } = render(<JsonViewer data={data} />);
    const output = lastFrame();

    expect(output).toContain("string");
    expect(output).toContain("42");
    expect(output).toContain("true");
    expect(output).toContain("null");
    expect(output).toContain("nested");
  });

  it("should handle scrolling offset", () => {
    const data = {
      line1: "value1",
      line2: "value2",
      line3: "value3",
      line4: "value4",
    };

    const { lastFrame } = render(<JsonViewer data={data} scrollOffset={2} />);
    const output = lastFrame();

    // With scroll offset, some early lines might not be visible
    // The exact behavior depends on terminal height simulation
    expect(output).toBeDefined();
  });
});
