/**
 * XML data converter
 */

import type { JsonValue } from "@core/types";
import { err, ok } from "neverthrow";
import type { DataValidationResult, XmlOptions } from "./types";
import { BaseDataConverter } from "./types";

export class XmlConverter extends BaseDataConverter<XmlOptions> {
  readonly format = "xml";
  readonly extension = ".xml";
  readonly displayName = "XML";

  validate(data: JsonValue): DataValidationResult {
    if (data === null || data === undefined) {
      return ok(undefined);
    }

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

  protected performConversion(data: JsonValue, options: XmlOptions): string {
    const {
      rootElement,
      arrayItemElement,
      indent,
      declaration,
      attributePrefix,
      textNodeName,
    } = options;

    let xml = "";

    // Add XML declaration if requested
    if (declaration) {
      xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
    }

    // Convert data to XML
    xml += this.convertValue(data, rootElement, 0, {
      arrayItemElement,
      indent,
      attributePrefix,
      textNodeName,
    });

    return xml;
  }

  private convertValue(
    value: JsonValue,
    elementName: string,
    depth: number,
    options: {
      arrayItemElement: string;
      indent: number;
      attributePrefix: string;
      textNodeName: string;
    },
  ): string {
    const { arrayItemElement, indent, attributePrefix, textNodeName } = options;
    const indentStr = " ".repeat(depth * indent);

    if (value === null || value === undefined) {
      return `${indentStr}<${elementName} />\n`;
    }

    if (typeof value !== "object") {
      const escapedValue = this.escapeXmlText(String(value));
      return `${indentStr}<${elementName}>${escapedValue}</${elementName}>\n`;
    }

    if (Array.isArray(value)) {
      let xml = `${indentStr}<${elementName}>\n`;

      for (const item of value) {
        xml += this.convertValue(item, arrayItemElement, depth + 1, options);
      }

      xml += `${indentStr}</${elementName}>\n`;
      return xml;
    }

    // Handle object
    const obj = value as Record<string, unknown>;
    const attributes: string[] = [];
    const elements: string[] = [];
    let textContent = "";

    // Separate attributes, text content, and child elements
    for (const [key, val] of Object.entries(obj)) {
      if (key.startsWith(attributePrefix)) {
        const attrName = key.substring(attributePrefix.length);
        const attrValue = this.escapeXmlAttribute(String(val));
        attributes.push(`${attrName}="${attrValue}"`);
      } else if (key === textNodeName) {
        textContent = this.escapeXmlText(String(val));
      } else {
        elements.push(
          this.convertValue(val as JsonValue, key, depth + 1, options),
        );
      }
    }

    // Build XML element
    let xml = `${indentStr}<${elementName}`;

    if (attributes.length > 0) {
      xml += ` ${attributes.join(" ")}`;
    }

    if (textContent && elements.length === 0) {
      // Element with only text content
      xml += `>${textContent}</${elementName}>\n`;
    } else if (elements.length === 0 && !textContent) {
      // Self-closing element
      xml += " />\n";
    } else {
      // Element with child elements
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
