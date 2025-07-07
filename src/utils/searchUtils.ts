/**
 * Search utilities for JSON content
 */

import type { JsonValue, SearchResult } from "../types/index.js";

/**
 * Search for a term in JSON content and return all matches
 */
export function searchInJson(
  data: JsonValue,
  searchTerm: string,
): SearchResult[] {
  if (!searchTerm.trim()) {
    return [];
  }

  const results: SearchResult[] = [];
  const jsonString = JSON.stringify(data, null, 2);
  const lines = jsonString.split("\n");
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
