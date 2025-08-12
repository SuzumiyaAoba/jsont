/**
 * Syntax highlighting utilities for JSON and JSON Schema content
 */

export interface HighlightToken {
  text: string;
  color: string;
  isMatch?: boolean;
}

export interface ColorScheme {
  key: string;
  stringValue: string;
  numberValue: string;
  booleanValue: string;
  nullValue: string;
  structuralObject: string;
  structuralArray: string;
  schemaKeyword: string;
  schemaProperty: string;
  default: string;
}

// Default color scheme for JSON and Schema highlighting
export const DEFAULT_COLOR_SCHEME: ColorScheme = {
  key: "blue",
  stringValue: "green",
  numberValue: "cyan",
  booleanValue: "yellow",
  nullValue: "gray",
  structuralObject: "magenta",
  structuralArray: "cyan",
  schemaKeyword: "blue",
  schemaProperty: "cyan",
  default: "white",
};

/**
 * Determines the appropriate color for a JSON value
 */
export function getJsonValueColor(
  value: string,
  colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME,
): string {
  const cleanValue = value.replace(/,$/, "");

  // Structural values
  if (cleanValue === "{") return colorScheme.structuralObject;
  if (cleanValue === "[") return colorScheme.structuralArray;

  // String values
  if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
    return colorScheme.stringValue;
  }

  // Boolean values
  if (cleanValue === "true" || cleanValue === "false") {
    return colorScheme.booleanValue;
  }

  // Null values
  if (cleanValue === "null") {
    return colorScheme.nullValue;
  }

  // Numeric values (JSON RFC 8259 compliant)
  // Supports: integers, decimals, negative numbers, scientific notation
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(cleanValue)) {
    return colorScheme.numberValue;
  }

  return colorScheme.default;
}

/**
 * Finds the colon that separates JSON key from value, ignoring colons inside quoted strings
 */
function findKeyValueSeparatorColon(line: string): number {
  let inQuotes = false;
  let escapeNext = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    // Found colon outside of quotes
    if (char === ":" && !inQuotes) {
      return i;
    }
  }

  return -1; // No valid colon found
}

/**
 * Determines if a line contains a JSON key-value pair
 */
export function isKeyValueLine(line: string): boolean {
  const trimmedLine = line.trim();
  return (
    findKeyValueSeparatorColon(trimmedLine) !== -1 &&
    !isStructuralLine(trimmedLine)
  );
}

/**
 * Determines if a line contains only structural characters
 */
export function isStructuralLine(line: string): boolean {
  const trimmedLine = line.trim();
  return (
    trimmedLine === "{" ||
    trimmedLine === "}" ||
    trimmedLine === "[" ||
    trimmedLine === "]" ||
    trimmedLine === "}," ||
    trimmedLine === "],"
  );
}

/**
 * Determines if a line contains a schema keyword
 */
export function isSchemaKeywordLine(line: string): boolean {
  const trimmedLine = line.trim();
  return (
    trimmedLine.includes('"$schema":') ||
    trimmedLine.includes('"title":') ||
    trimmedLine.includes('"description":') ||
    trimmedLine.includes('"type":')
  );
}

/**
 * Parses a key-value line into its components
 */
export function parseKeyValueLine(line: string): {
  beforeColon: string;
  afterColon: string;
  value: string;
  isStructuralValue: boolean;
} {
  const colonIndex = findKeyValueSeparatorColon(line);

  if (colonIndex === -1) {
    // Fallback: treat entire line as key if no valid colon found
    return {
      beforeColon: line,
      afterColon: "",
      value: "",
      isStructuralValue: false,
    };
  }

  const beforeColon = line.substring(0, colonIndex);
  const afterColon = line.substring(colonIndex);

  const valueMatch = afterColon.match(/:\s*(.+?)(?:,\s*)?$/);
  const value = valueMatch?.[1] ?? afterColon.substring(1).trim();
  const isStructuralValue = value === "{" || value === "[";

  return { beforeColon, afterColon, value, isStructuralValue };
}

/**
 * Tokenizes a line for more robust highlighting
 */
export function tokenizeLine(
  line: string,
  _searchTerm: string = "",
  colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME,
): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  const trimmedLine = line.trim();

  // Handle empty lines
  if (!line.trim()) {
    return [{ text: line, color: colorScheme.default }];
  }

  // Handle structural lines
  if (isStructuralLine(trimmedLine)) {
    const isArrayBracket =
      trimmedLine.includes("[") || trimmedLine.includes("]");
    const color = isArrayBracket
      ? colorScheme.structuralArray
      : colorScheme.structuralObject;
    return [{ text: line, color }];
  }

  // Handle key-value lines
  if (isKeyValueLine(line)) {
    const { beforeColon, value, isStructuralValue } = parseKeyValueLine(line);

    // Determine key color based on context
    let keyColor = colorScheme.key; // Default to blue for regular JSON keys
    if (isSchemaKeywordLine(line)) {
      keyColor = colorScheme.schemaKeyword; // Blue for schema keywords like $schema, title, description, type
    }

    // Determine value color
    let valueColor = colorScheme.default;
    if (isStructuralValue) {
      valueColor =
        value === "{"
          ? colorScheme.structuralObject
          : colorScheme.structuralArray;
    } else {
      valueColor = getJsonValueColor(value || "", colorScheme);
    }

    // Build tokens for key-value line
    tokens.push({ text: beforeColon, color: keyColor });
    tokens.push({ text: ": ", color: colorScheme.default });
    tokens.push({ text: value || "", color: valueColor });

    if (line.endsWith(",")) {
      tokens.push({ text: ",", color: colorScheme.default });
    }

    return tokens;
  }

  // Handle array values (lines without colons)
  if (trimmedLine && !trimmedLine.includes(":")) {
    const cleanValue = trimmedLine.replace(/,$/, "");
    const valueColor = getJsonValueColor(cleanValue, colorScheme);

    const leadingWhitespace = line.substring(0, line.indexOf(trimmedLine));
    if (leadingWhitespace) {
      tokens.push({ text: leadingWhitespace, color: colorScheme.default });
    }

    tokens.push({ text: cleanValue, color: valueColor });

    if (line.endsWith(",")) {
      tokens.push({ text: ",", color: colorScheme.default });
    }

    return tokens;
  }

  // Default: return line as-is
  return [{ text: line, color: colorScheme.default }];
}

/**
 * Applies search highlighting to tokens while preserving syntax highlighting
 */
export function applySearchHighlighting(
  tokens: HighlightToken[],
  searchTerm: string,
  isCurrentResult: boolean = false,
  isRegexMode: boolean = false,
  currentResultPosition?: { columnStart: number; columnEnd: number } | null,
): HighlightToken[] {
  if (!searchTerm.trim()) {
    return tokens;
  }

  const highlightedTokens: HighlightToken[] = [];
  let tokenStartPosition = 0; // Track position in the original line

  for (const token of tokens) {
    let hasMatch = false;

    if (isRegexMode) {
      try {
        const regex = new RegExp(searchTerm, "gi");
        let lastIndex = 0;
        let match = regex.exec(token.text);
        let matchCount = 0;
        const maxMatches = 50; // Reasonable limit for token highlighting
        const startTime = Date.now();
        const maxTime = 100; // Maximum 100ms for token highlighting

        while (match !== null && matchCount < maxMatches) {
          // Check for timeout to prevent ReDoS attacks
          if (Date.now() - startTime > maxTime) {
            console.warn("Token regex highlighting timed out, using fallback");
            hasMatch = false;
            break;
          }
          hasMatch = true;

          // Add text before match
          if (match.index > lastIndex) {
            highlightedTokens.push({
              text: token.text.substring(lastIndex, match.index),
              color: token.color,
            });
          }

          // Calculate absolute position of this match
          const matchAbsoluteStart = tokenStartPosition + match.index;
          const matchAbsoluteEnd = matchAbsoluteStart + match[0].length;

          // Check if this specific match is the current result
          const isThisMatchCurrent =
            isCurrentResult &&
            currentResultPosition &&
            matchAbsoluteStart >= currentResultPosition.columnStart &&
            matchAbsoluteEnd <= currentResultPosition.columnEnd;

          // Add match with search highlighting
          highlightedTokens.push({
            text: match[0],
            color: isThisMatchCurrent ? "white" : "black",
            isMatch: true,
          });

          lastIndex = match.index + match[0].length;
          matchCount++;

          // Prevent infinite loop for zero-length matches
          if (match[0].length === 0) {
            regex.lastIndex++;
          }

          match = regex.exec(token.text);
        }

        // Add remaining text after all matches
        if (hasMatch && lastIndex < token.text.length) {
          highlightedTokens.push({
            text: token.text.substring(lastIndex),
            color: token.color,
          });
        }
      } catch (_error) {
        // Invalid regex - fall back to literal string search
        hasMatch = false;
        const tokenLower = token.text.toLowerCase();
        const searchTermLower = searchTerm.toLowerCase();
        let startIndex = 0;

        while (true) {
          const foundIndex = tokenLower.indexOf(searchTermLower, startIndex);
          if (foundIndex === -1) {
            // Add remaining text
            if (hasMatch && startIndex < token.text.length) {
              highlightedTokens.push({
                text: token.text.substring(startIndex),
                color: token.color,
              });
            }
            break;
          }

          hasMatch = true;

          // Add text before match
          if (foundIndex > startIndex) {
            highlightedTokens.push({
              text: token.text.substring(startIndex, foundIndex),
              color: token.color,
            });
          }

          // Calculate absolute position of this match
          const matchAbsoluteStart = tokenStartPosition + foundIndex;
          const matchAbsoluteEnd = matchAbsoluteStart + searchTerm.length;

          // Check if this specific match is the current result
          const isThisMatchCurrent =
            isCurrentResult &&
            currentResultPosition &&
            matchAbsoluteStart >= currentResultPosition.columnStart &&
            matchAbsoluteEnd <= currentResultPosition.columnEnd;

          // Add match with search highlighting
          highlightedTokens.push({
            text: token.text.substring(
              foundIndex,
              foundIndex + searchTerm.length,
            ),
            color: isThisMatchCurrent ? "white" : "black",
            isMatch: true,
          });

          startIndex = foundIndex + searchTerm.length;
        }
      }
    } else {
      const tokenLower = token.text.toLowerCase();
      const searchTermLower = searchTerm.toLowerCase();
      let startIndex = 0;

      while (true) {
        const foundIndex = tokenLower.indexOf(searchTermLower, startIndex);
        if (foundIndex === -1) {
          // Add remaining text
          if (hasMatch && startIndex < token.text.length) {
            highlightedTokens.push({
              text: token.text.substring(startIndex),
              color: token.color,
            });
          }
          break;
        }

        hasMatch = true;

        // Add text before match
        if (foundIndex > startIndex) {
          highlightedTokens.push({
            text: token.text.substring(startIndex, foundIndex),
            color: token.color,
          });
        }

        // Calculate absolute position of this match
        const matchAbsoluteStart = tokenStartPosition + foundIndex;
        const matchAbsoluteEnd = matchAbsoluteStart + searchTerm.length;

        // Check if this specific match is the current result
        const isThisMatchCurrent =
          isCurrentResult &&
          currentResultPosition &&
          matchAbsoluteStart >= currentResultPosition.columnStart &&
          matchAbsoluteEnd <= currentResultPosition.columnEnd;

        // Add match with search highlighting
        highlightedTokens.push({
          text: token.text.substring(
            foundIndex,
            foundIndex + searchTerm.length,
          ),
          color: isThisMatchCurrent ? "white" : "black",
          isMatch: true,
        });

        startIndex = foundIndex + searchTerm.length;
      }
    }

    // If no matches found in this token, add the original token unchanged
    if (!hasMatch) {
      highlightedTokens.push(token);
    }

    // Update token position for the next token
    tokenStartPosition += token.text.length;
  }

  return highlightedTokens;
}
