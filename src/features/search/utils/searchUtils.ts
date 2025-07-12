/**
 * Search utilities for JSON content
 */

import type { JsonValue, SearchResult } from "@core/types/index.js";
import {
  formatJsonSchema,
  inferJsonSchema,
} from "@features/schema/utils/schemaUtils.js";
import type { SearchScope } from "@features/search/types/search.js";

/**
 * Search for a term in JSON content and return all matches
 *
 * @param data - JSON data to search in
 * @param searchTerm - Term to search for (case-insensitive)
 * @param searchScope - Scope of search: 'all', 'keys', or 'values'
 * @returns Array of search results with line and column information
 */
export function searchInJson(
  data: JsonValue,
  searchTerm: string,
  searchScope: SearchScope = "all",
): SearchResult[] {
  if (!data || !searchTerm.trim()) {
    return [];
  }

  const jsonString = JSON.stringify(data, null, 2);

  if (searchScope === "all") {
    return searchInText(jsonString, searchTerm);
  }

  return searchInJsonWithScope(data, searchTerm, searchScope);
}

/**
 * Search for a term in JSON with specific scope (keys or values only)
 *
 * @param data - JSON data to search in
 * @param searchTerm - Term to search for (case-insensitive)
 * @param searchScope - Scope of search: 'keys' or 'values'
 * @returns Array of search results with line and column information
 */
export function searchInJsonWithScope(
  data: JsonValue,
  searchTerm: string,
  searchScope: "keys" | "values",
): SearchResult[] {
  if (!data || !searchTerm.trim()) {
    return [];
  }

  const results: SearchResult[] = [];
  const jsonString = JSON.stringify(data, null, 2);
  const lines = jsonString.split("\n");

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();

    // Skip lines that don't contain key-value pairs
    if (!trimmedLine.includes(":")) {
      return;
    }

    // Parse line to identify keys and values
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) return;

    const keyPart = line.substring(0, colonIndex);
    const valuePart = line.substring(colonIndex + 1);

    if (searchScope === "keys") {
      // Search only in keys (everything before ":")
      const keyMatches = findMatchesInText(keyPart, searchTerm, lineIndex, 0);
      // Fix contextLine to use full line
      keyMatches.forEach((match) => {
        match.contextLine = line;
      });
      results.push(...keyMatches);
    } else if (searchScope === "values") {
      // Search only in values (everything after ":")
      const valueMatches = findMatchesInText(
        valuePart,
        searchTerm,
        lineIndex,
        colonIndex + 1,
      );
      // Fix contextLine to use full line
      valueMatches.forEach((match) => {
        match.contextLine = line;
      });
      results.push(...valueMatches);
    }
  });

  return results;
}

/**
 * Search for a term in JSON schema content and return all matches
 *
 * @param data - JSON data to generate schema from and search in
 * @param searchTerm - Term to search for (case-insensitive)
 * @param searchScope - Scope of search: 'all', 'keys', or 'values'
 * @returns Array of search results with line and column information
 */
export function searchInJsonSchema(
  data: JsonValue,
  searchTerm: string,
  searchScope: SearchScope = "all",
): SearchResult[] {
  if (!data || !searchTerm.trim()) {
    return [];
  }

  try {
    const schema = inferJsonSchema(data, "JSON Schema");
    const schemaString = formatJsonSchema(schema);

    if (searchScope === "all") {
      return searchInText(schemaString, searchTerm);
    }

    // For schema search with scope, parse the formatted schema as JSON
    const parsedSchema = JSON.parse(schemaString);
    return searchInJsonWithScope(parsedSchema, searchTerm, searchScope);
  } catch (error) {
    // If schema generation fails, return empty results
    console.warn("Failed to generate schema for search:", error);
    return [];
  }
}

/**
 * Search for a term in arbitrary text content and return all matches
 *
 * @param text - Text content to search in
 * @param searchTerm - Term to search for (case-insensitive)
 * @returns Array of search results with line and column information
 */
export function searchInText(text: string, searchTerm: string): SearchResult[] {
  if (!text || !searchTerm.trim()) {
    return [];
  }

  const results: SearchResult[] = [];
  const lines = text.split("\n");
  const searchTermLower = searchTerm.toLowerCase();

  lines.forEach((line, lineIndex) => {
    const lineLower = line.toLowerCase();
    let startIndex = 0;

    // Find all occurrences in this line
    while (true) {
      const foundIndex = lineLower.indexOf(searchTermLower, startIndex);
      if (foundIndex === -1) break;

      results.push({
        lineIndex,
        columnStart: foundIndex,
        columnEnd: foundIndex + searchTerm.length,
        matchText: line.substring(foundIndex, foundIndex + searchTerm.length),
        contextLine: line,
      });

      startIndex = foundIndex + 1;
    }
  });

  return results;
}

/**
 * Check if a line contains a search term
 */
export function lineContainsSearch(line: string, searchTerm: string): boolean {
  if (!searchTerm.trim()) return false;
  return line.toLowerCase().includes(searchTerm.toLowerCase());
}

/**
 * Highlight search term in a line
 */
export function highlightSearchInLine(
  line: string,
  searchTerm: string,
): Array<{ text: string; isMatch: boolean }> {
  if (!searchTerm.trim()) {
    return [{ text: line, isMatch: false }];
  }

  const parts: Array<{ text: string; isMatch: boolean }> = [];
  const lineLower = line.toLowerCase();
  const searchTermLower = searchTerm.toLowerCase();
  let lastIndex = 0;

  while (true) {
    const foundIndex = lineLower.indexOf(searchTermLower, lastIndex);
    if (foundIndex === -1) {
      // Add remaining text
      if (lastIndex < line.length) {
        parts.push({ text: line.substring(lastIndex), isMatch: false });
      }
      break;
    }

    // Add text before match
    if (foundIndex > lastIndex) {
      parts.push({
        text: line.substring(lastIndex, foundIndex),
        isMatch: false,
      });
    }

    // Add match
    parts.push({
      text: line.substring(foundIndex, foundIndex + searchTerm.length),
      isMatch: true,
    });

    lastIndex = foundIndex + searchTerm.length;
  }

  return parts;
}

/**
 * Get search navigation info
 */
export function getSearchNavigationInfo(
  searchResults: SearchResult[],
  currentIndex: number,
): string {
  if (searchResults.length === 0) {
    return "No matches";
  }

  return `${currentIndex + 1}/${searchResults.length}`;
}

/**
 * Find all matches of a search term in a text segment
 *
 * @param text - Text to search in
 * @param searchTerm - Term to search for
 * @param lineIndex - Line number for the results
 * @param columnOffset - Column offset to add to match positions
 * @returns Array of search results
 */
function findMatchesInText(
  text: string,
  searchTerm: string,
  lineIndex: number,
  columnOffset: number,
): SearchResult[] {
  const results: SearchResult[] = [];
  const textLower = text.toLowerCase();
  const searchTermLower = searchTerm.toLowerCase();
  let startIndex = 0;

  while (true) {
    const foundIndex = textLower.indexOf(searchTermLower, startIndex);
    if (foundIndex === -1) break;

    results.push({
      lineIndex,
      columnStart: foundIndex + columnOffset,
      columnEnd: foundIndex + searchTerm.length + columnOffset,
      matchText: text.substring(foundIndex, foundIndex + searchTerm.length),
      contextLine: text, // Note: This should be the full line, will be handled by caller
    });

    startIndex = foundIndex + 1;
  }

  return results;
}

/**
 * Get display name for search scope
 */
export function getSearchScopeDisplayName(scope: SearchScope): string {
  switch (scope) {
    case "all":
      return "All";
    case "keys":
      return "Keys";
    case "values":
      return "Values";
    default:
      return "All";
  }
}

/**
 * Get next search scope in cycle
 */
export function getNextSearchScope(current: SearchScope): SearchScope {
  switch (current) {
    case "all":
      return "keys";
    case "keys":
      return "values";
    case "values":
      return "all";
    default:
      return "all";
  }
}
