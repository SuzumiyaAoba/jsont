/**
 * Search utilities for JSON content
 */

import type { JsonValue, SearchResult } from "../types/index";
import { formatJsonSchema, inferJsonSchema } from "./schemaUtils";

/**
 * Search for a term in JSON content and return all matches
 *
 * @param data - JSON data to search in
 * @param searchTerm - Term to search for (case-insensitive)
 * @returns Array of search results with line and column information
 */
export function searchInJson(
  data: JsonValue,
  searchTerm: string,
): SearchResult[] {
  if (!data || !searchTerm.trim()) {
    return [];
  }

  const jsonString = JSON.stringify(data, null, 2);
  return searchInText(jsonString, searchTerm);
}

/**
 * Search for a term in JSON schema content and return all matches
 *
 * @param data - JSON data to generate schema from and search in
 * @param searchTerm - Term to search for (case-insensitive)
 * @returns Array of search results with line and column information
 */
export function searchInJsonSchema(
  data: JsonValue,
  searchTerm: string,
): SearchResult[] {
  if (!data || !searchTerm.trim()) {
    return [];
  }

  try {
    const schema = inferJsonSchema(data, "JSON Schema");
    const schemaString = formatJsonSchema(schema);
    return searchInText(schemaString, searchTerm);
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
