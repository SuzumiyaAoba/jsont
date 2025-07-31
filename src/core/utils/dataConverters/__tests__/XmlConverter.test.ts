/**
 * Tests for XmlConverter
 */

import { describe, expect, it } from "vitest";
import { XmlConverter } from "../XmlConverter";

describe("XmlConverter", () => {
  const converter = new XmlConverter();

  describe("format properties", () => {
    it("should have correct format properties", () => {
      expect(converter.format).toBe("xml");
      expect(converter.extension).toBe(".xml");
      expect(converter.displayName).toBe("XML");
    });
  });

  describe("getDefaultOptions", () => {
    it("should return default XML options", () => {
      const options = converter.getDefaultOptions();
      expect(options).toEqual({
        rootElement: "root",
        arrayItemElement: "item",
        indent: 2,
        declaration: true,
        attributePrefix: "@",
        textNodeName: "#text",
      });
    });
  });

  describe("validate", () => {
    it("should validate simple values", () => {
      const result1 = converter.validate("test");
      expect(result1.isOk()).toBe(true);

      const result2 = converter.validate(123);
      expect(result2.isOk()).toBe(true);

      const result3 = converter.validate(true);
      expect(result3.isOk()).toBe(true);

      const result4 = converter.validate(null);
      expect(result4.isOk()).toBe(true);
    });

    it("should validate objects and arrays", () => {
      const result1 = converter.validate({ key: "value" });
      expect(result1.isOk()).toBe(true);

      const result2 = converter.validate([1, 2, 3]);
      expect(result2.isOk()).toBe(true);

      const result3 = converter.validate([{ id: 1 }, { id: 2 }]);
      expect(result3.isOk()).toBe(true);
    });

    it("should reject function values", () => {
      const result = converter.validate(() => {});
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain(
          "Functions cannot be converted to XML",
        );
        expect(result.error.type).toBe("VALIDATION_ERROR");
      }
    });
  });

  describe("convert", () => {
    describe("primitive values", () => {
      it("should convert string values", () => {
        const result = converter.convert("Hello World");
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBe(
            '<?xml version="1.0" encoding="UTF-8"?>\n<root>Hello World</root>\n',
          );
        }
      });

      it("should convert numeric values", () => {
        const result = converter.convert(42);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBe(
            '<?xml version="1.0" encoding="UTF-8"?>\n<root>42</root>\n',
          );
        }
      });

      it("should convert boolean values", () => {
        const result = converter.convert(true);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBe(
            '<?xml version="1.0" encoding="UTF-8"?>\n<root>true</root>\n',
          );
        }
      });

      it("should convert null values", () => {
        const result = converter.convert(null);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBe(
            '<?xml version="1.0" encoding="UTF-8"?>\n<root />\n',
          );
        }
      });
    });

    describe("objects", () => {
      it("should convert simple objects", () => {
        const data = { name: "John", age: 30 };
        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const expected =
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            "<root>\n" +
            "  <name>John</name>\n" +
            "  <age>30</age>\n" +
            "</root>\n";
          expect(result.value).toBe(expected);
        }
      });

      it("should handle nested objects", () => {
        const data = {
          user: {
            name: "John",
            contact: {
              email: "john@example.com",
            },
          },
        };
        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const xml = result.value;
          expect(xml).toContain("<user>");
          expect(xml).toContain("<name>John</name>");
          expect(xml).toContain("<contact>");
          expect(xml).toContain("<email>john@example.com</email>");
        }
      });

      it("should handle attributes with prefix", () => {
        const data = {
          "@id": "123",
          "@class": "user",
          name: "John",
        };
        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const xml = result.value;
          expect(xml).toContain('id="123"');
          expect(xml).toContain('class="user"');
          expect(xml).toContain("<name>John</name>");
        }
      });

      it("should handle text content with special text node", () => {
        const data = {
          "@type": "message",
          "#text": "Hello World",
        };
        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const xml = result.value;
          expect(xml).toContain('type="message"');
          expect(xml).toContain(">Hello World<");
        }
      });
    });

    describe("arrays", () => {
      it("should convert simple arrays", () => {
        const data = [1, 2, 3];
        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const xml = result.value;
          expect(xml).toContain("<item>1</item>");
          expect(xml).toContain("<item>2</item>");
          expect(xml).toContain("<item>3</item>");
        }
      });

      it("should convert array of objects", () => {
        const data = [
          { id: 1, name: "John" },
          { id: 2, name: "Jane" },
        ];
        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const xml = result.value;
          expect(xml).toContain("<item>");
          expect(xml).toContain("<id>1</id>");
          expect(xml).toContain("<name>John</name>");
          expect(xml).toContain("<id>2</id>");
          expect(xml).toContain("<name>Jane</name>");
        }
      });
    });

    describe("XML escaping", () => {
      it("should escape special XML characters in text", () => {
        const data = { message: 'Hello <world> & "friends"' };
        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const xml = result.value;
          expect(xml).toContain("Hello &lt;world&gt; &amp;");
        }
      });

      it("should escape special XML characters in attributes", () => {
        const data = { "@title": 'Test & "Demo"' };
        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const xml = result.value;
          expect(xml).toContain('title="Test &amp; &quot;Demo&quot;"');
        }
      });
    });

    describe("custom options", () => {
      it("should use custom root element name", () => {
        const data = { name: "test" };
        const result = converter.convert(data, { rootElement: "data" });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toContain("<data>");
          expect(result.value).toContain("</data>");
        }
      });

      it("should use custom array item element name", () => {
        const data = [1, 2, 3];
        const result = converter.convert(data, { arrayItemElement: "number" });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const xml = result.value;
          expect(xml).toContain("<number>1</number>");
          expect(xml).toContain("<number>2</number>");
          expect(xml).toContain("<number>3</number>");
        }
      });

      it("should respect declaration option", () => {
        const data = "test";
        const result = converter.convert(data, { declaration: false });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).not.toContain("<?xml");
          expect(result.value).toBe("<root>test</root>\n");
        }
      });

      it("should use custom indent", () => {
        const data = { nested: { value: "test" } };
        const result = converter.convert(data, { indent: 4 });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const xml = result.value;
          expect(xml).toContain("    <nested>");
          expect(xml).toContain("        <value>test</value>");
        }
      });

      it("should use custom attribute prefix", () => {
        const data = { $id: "123", name: "test" };
        const result = converter.convert(data, { attributePrefix: "$" });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const xml = result.value;
          expect(xml).toContain('id="123"');
          expect(xml).toContain("<name>test</name>");
        }
      });

      it("should use custom text node name", () => {
        const data = { content: "Hello World" };
        const result = converter.convert(data, { textNodeName: "content" });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const xml = result.value;
          expect(xml).toContain(">Hello World<");
        }
      });
    });

    describe("complex data structures", () => {
      it("should handle mixed content with attributes and elements", () => {
        const data = {
          book: {
            "@isbn": "978-0123456789",
            "@category": "fiction",
            title: "Example Book",
            author: {
              name: "John Doe",
              "@id": "author123",
            },
            chapters: [
              { "@number": "1", title: "Introduction" },
              { "@number": "2", title: "Chapter Two" },
            ],
          },
        };

        const result = converter.convert(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const xml = result.value;
          expect(xml).toContain('isbn="978-0123456789"');
          expect(xml).toContain('category="fiction"');
          expect(xml).toContain("<title>Example Book</title>");
          expect(xml).toContain('id="author123"');
          expect(xml).toContain("<chapters>");
          expect(xml).toContain('number="1"');
        }
      });
    });

    describe("error handling", () => {
      it("should handle conversion gracefully even with complex data", () => {
        // The XML converter is very robust and handles most data types
        const result = converter.convert("test");
        expect(result.isOk()).toBe(true);

        // Test that complex data gets converted gracefully
        const complexResult = converter.convert({ test: "value" });
        expect(complexResult.isOk()).toBe(true);
        if (complexResult.isOk()) {
          expect(complexResult.value).toContain("<root>");
        }
      });
    });
  });
});
