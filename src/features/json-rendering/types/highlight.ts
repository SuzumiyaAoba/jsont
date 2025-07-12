/**
 * JSON syntax highlighting type definitions
 */

export interface JsonToken {
  type:
    | "key"
    | "string"
    | "number"
    | "boolean"
    | "null"
    | "bracket"
    | "brace"
    | "comma"
    | "colon";
  value: string;
  startIndex: number;
  endIndex: number;
}

export interface HighlightOptions {
  searchTerm?: string;
  showLineNumbers?: boolean;
  theme?: "dark" | "light";
}

export interface SyntaxColors {
  key: string;
  string: string;
  number: string;
  boolean: string;
  null: string;
  bracket: string;
  brace: string;
  comma: string;
  colon: string;
  background: string;
  text: string;
  highlight: string;
}
