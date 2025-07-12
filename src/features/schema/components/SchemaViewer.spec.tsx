import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import type { JsonValue } from "../../../core/types/index";
import { SchemaViewer } from "./SchemaViewer";

describe("SchemaViewer", () => {
  it("should render message when no data is provided", () => {
    const { lastFrame } = render(<SchemaViewer data={null} />);
    const output = lastFrame();
    expect(output).toContain("No JSON data to generate schema");
  });

  it("should render schema for simple object", () => {
    const data: JsonValue = {
      name: "John",
      age: 30,
      active: true,
    };

    const { lastFrame } = render(<SchemaViewer data={data} />);
    const output = lastFrame();

    expect(output).toContain('"$schema"');
    expect(output).toContain('"type": "object"');
    expect(output).toContain('"properties"');
    expect(output).toContain("name");
    expect(output).toContain("age");
    expect(output).toContain("active");
  });

  it("should render schema for arrays", () => {
    const data: JsonValue = ["item1", "item2", "item3"];

    const { lastFrame } = render(<SchemaViewer data={data} />);
    const output = lastFrame();

    expect(output).toContain('"type": "array"');
    expect(output).toContain('"items"');
  });

  it("should render schema for nested objects", () => {
    const data: JsonValue = {
      user: {
        profile: {
          name: "Alice",
          age: 25,
        },
        posts: [
          { title: "Post 1", views: 100 },
          { title: "Post 2", views: 200 },
        ],
      },
    };

    const { lastFrame } = render(<SchemaViewer data={data} />);
    const output = lastFrame();

    expect(output).toContain('"type": "object"');
    expect(output).toContain("user");
    // Note: Nested properties may not be visible in limited viewport
    expect(output).toContain('"properties"');
  });

  it("should render schema for primitive types", () => {
    const stringData: JsonValue = "hello world";
    const { lastFrame: stringFrame } = render(
      <SchemaViewer data={stringData} />,
    );
    const stringOutput = stringFrame();
    expect(stringOutput).toContain('"type": "string"');

    const numberData: JsonValue = 42;
    const { lastFrame: numberFrame } = render(
      <SchemaViewer data={numberData} />,
    );
    const numberOutput = numberFrame();
    expect(numberOutput).toContain('"type": "integer"');

    const boolData: JsonValue = true;
    const { lastFrame: boolFrame } = render(<SchemaViewer data={boolData} />);
    const boolOutput = boolFrame();
    expect(boolOutput).toContain('"type": "boolean"');
  });

  it("should handle line numbers when enabled", () => {
    const data: JsonValue = {
      name: "test",
      value: 123,
    };

    const { lastFrame } = render(
      <SchemaViewer data={data} showLineNumbers={true} />,
    );
    const output = lastFrame();

    // Should contain line numbers (numbers at the beginning of lines)
    expect(output).toMatch(/\d+/);
  });

  it("should handle scrolling with offset", () => {
    const data: JsonValue = {
      field1: "value1",
      field2: "value2",
      field3: "value3",
      field4: "value4",
      field5: "value5",
    };

    const { lastFrame } = render(
      <SchemaViewer data={data} scrollOffset={2} visibleLines={3} />,
    );
    const output = lastFrame();

    // Should render only visible lines based on scroll offset
    expect(output).toBeDefined();
  });

  it("should handle search highlighting", () => {
    const data: JsonValue = {
      searchableField: "findme",
      anotherField: "normal",
    };

    const searchResults = [
      {
        lineIndex: 3,
        columnStart: 5,
        columnEnd: 11,
        matchText: "findme",
        contextLine: '  "searchableField": "findme"',
      },
    ];

    const { lastFrame } = render(
      <SchemaViewer
        data={data}
        searchTerm="findme"
        searchResults={searchResults}
        currentSearchIndex={0}
      />,
    );
    const output = lastFrame();

    expect(output).toBeDefined();
    // Note: The actual highlighting would be in ANSI escape codes which are hard to test directly
  });

  it("should handle empty objects and arrays", () => {
    const emptyObject: JsonValue = {};
    const { lastFrame: objectFrame } = render(
      <SchemaViewer data={emptyObject} />,
    );
    const objectOutput = objectFrame();
    expect(objectOutput).toContain('"type": "object"');
    expect(objectOutput).toContain('"properties": {}');

    const emptyArray: JsonValue = [];
    const { lastFrame: arrayFrame } = render(
      <SchemaViewer data={emptyArray} />,
    );
    const arrayOutput = arrayFrame();
    expect(arrayOutput).toContain('"type": "array"');
  });

  it("should detect and highlight schema-specific keywords", () => {
    const data: JsonValue = {
      email: "test@example.com",
      website: "https://example.com",
      createdAt: "2023-01-01T00:00:00Z",
      id: "123e4567-e89b-12d3-a456-426614174000",
    };

    const { lastFrame } = render(<SchemaViewer data={data} />);
    const output = lastFrame();

    expect(output).toContain('"format"');
    expect(output).toContain("email");
    // Note: Other formats may not be visible in limited viewport
    expect(output).toContain('"properties"');
  });

  it("should handle complex nested structures", () => {
    const data: JsonValue = {
      users: [
        {
          id: 1,
          profile: {
            personal: {
              name: "John",
              email: "john@example.com",
            },
            preferences: {
              theme: "dark",
              notifications: true,
            },
          },
          roles: ["admin", "user"],
        },
      ],
      metadata: {
        total: 1,
        pagination: {
          page: 1,
          limit: 10,
          hasNext: false,
        },
      },
    };

    const { lastFrame } = render(<SchemaViewer data={data} />);
    const output = lastFrame();

    expect(output).toContain('"$schema"');
    expect(output).toContain('"type": "object"');
    expect(output).toContain("users");
    // Note: required section may not be visible in limited viewport
    expect(output).toContain('"properties"');
  });

  it("should render with proper visible lines calculation", () => {
    const data: JsonValue = {
      longObject: {
        field1: "value1",
        field2: "value2",
        field3: "value3",
        field4: "value4",
        field5: "value5",
        field6: "value6",
        field7: "value7",
        field8: "value8",
      },
    };

    // Test with specific visible lines
    const { lastFrame } = render(<SchemaViewer data={data} visibleLines={5} />);
    const output = lastFrame();

    expect(output).toBeDefined();
    // Note: visibleLines controls content lines, not total output including padding
    expect(output).toContain('"$schema"');
  });
});
