import type { Highlighter } from "@features/common/types/viewer";
import {
  applySearchHighlighting,
  type HighlightToken,
  tokenizeLine,
} from "@features/json-rendering/utils/syntaxHighlight";

/**
 * JSON-specific highlighter implementation
 * Uses existing syntax highlighting utilities directly
 */
export class JsonHighlighter implements Highlighter {
  tokenizeLine(line: string): HighlightToken[] {
    // Use existing tokenizeLine function directly
    return tokenizeLine(line, "");
  }

  applySearchHighlighting(
    tokens: HighlightToken[],
    searchTerm: string,
    isCurrentResult: boolean = false,
  ): HighlightToken[] {
    // Use existing search highlighting function directly
    return applySearchHighlighting(tokens, searchTerm, isCurrentResult);
  }
}

// Export a shared instance
export const jsonHighlighter = new JsonHighlighter();
