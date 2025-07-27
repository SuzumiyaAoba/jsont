/**
 * XML data converter
 */

import type { JsonValue } from "@core/types/index";
import { err, ok } from "neverthrow";
import type {
  ConversionResult,
  DataConverter,
  DataValidationResult,
  XmlOptions,
} from "./types";

export class XmlConverter implements DataConverter<XmlOptions> {
  readonly format = "xml";
  readonly extension = ".xml";
  readonly displayName = "XML";

  convert(
    data: JsonValue,
    options?: XmlOptions | Record<string, unknown>,
  ): ConversionResult {
    try {
      const xmlOptions = { ...this.getDefaultOptions(), ...options };
      const result = this.convertToXML(data, xmlOptions);

      return ok(result);
    } catch (error) {
      return err({
        type: "CONVERSION_ERROR" as const,
        message:
          error instanceof Error ? error.message : "XML conversion failed",
        format: this.format,
        context: { options },
      });
    }
  }

  validate(data: JsonValue): DataValidationResult {
    // XML can represent most JSON structures
    // Only restriction is function types which JSON doesn't support anyway
    if (typeof data === "function") {
      return err({
        type: "VALIDATION_ERROR" as const,
        message: "Functions cannot be converted to XML",
        format: this.format,
      });
    }

    return ok(undefined);
  }

  getDefaultOptions(): XmlOptions {
    return {
      rootElement: "root",
      arrayItemElement: "item",
      indent: 2,
      declaration: true,
      attributePrefix: "@",
      textNodeName: "#text",
    };
  }

  private convertToXML(data: JsonValue, options: XmlOptions): string {
    const { declaration, rootElement } = options;

    let xml = "";

    // Add XML declaration if requested
    if (declaration) {
      xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
    }

    // Convert the data with root element
    xml += this.jsonToXmlElement(data, rootElement, options, 0);

    return xml;
  }

  private jsonToXmlElement(
    data: JsonValue,
    elementName: string,
    options: XmlOptions,
    depth: number,
  ): string {
    const { indent, attributePrefix, textNodeName, arrayItemElement } = options;
    const indentStr = " ".repeat(depth * indent);

    if (data === null || data === undefined) {
      return `${indentStr}<${elementName} />\n`;
    }

    if (
      typeof data === "string" ||
      typeof data === "number" ||
      typeof data === "boolean"
    ) {
      const escapedValue = this.escapeXmlText(String(data));
      return `${indentStr}<${elementName}>${escapedValue}</${elementName}>\n`;
    }

    if (Array.isArray(data)) {
      let xml = `${indentStr}<${elementName}>\n`;

      for (const item of data) {
        xml += this.jsonToXmlElement(
          item,
          arrayItemElement,
          options,
          depth + 1,
        );
      }

      xml += `${indentStr}</${elementName}>\n`;
      return xml;
    }

    if (typeof data === "object" && data !== null) {
      const obj = data as Record<string, JsonValue>;
      const attributes: string[] = [];
      const elements: string[] = [];
      let textContent = "";

      // Separate attributes, text content, and child elements
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith(attributePrefix)) {
          // Attribute
          const attrName = key.slice(attributePrefix.length);
          const attrValue = this.escapeXmlAttribute(String(value));
          attributes.push(`${attrName}="${attrValue}"`);
        } else if (key === textNodeName) {
          // Text content
          textContent = this.escapeXmlText(String(value));
        } else {
          // Child element
          elements.push(this.jsonToXmlElement(value, key, options, depth + 1));
        }
      }

      // Build the element
      let xml = `${indentStr}<${elementName}`;

      if (attributes.length > 0) {
        xml += ` ${attributes.join(" ")}`;
      }

      if (elements.length === 0 && textContent === "") {
        xml += " />\n";
      } else if (elements.length === 0 && textContent !== "") {
        xml += `>${textContent}</${elementName}>\n`;
      } else {
        xml += ">\n";

        if (textContent) {
          xml += `${" ".repeat((depth + 1) * indent)}${textContent}\n`;
        }

        for (const element of elements) {
          xml += element;
        }

        xml += `${indentStr}</${elementName}>\n`;
      }

      return xml;
    }

    // Fallback for any other type
    return `${indentStr}<${elementName}>${this.escapeXmlText(String(data))}</${elementName}>\n`;
  }

  private escapeXmlText(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  private escapeXmlAttribute(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
