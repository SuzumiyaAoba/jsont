import type {
  Highlighter,
  HighlightToken,
} from "@features/common/types/viewer";
import {
  applySearchHighlighting,
  tokenizeLine,
} from "@features/json-rendering/utils/syntaxHighlight";

/**
 * JSON-specific highlighter implementation
 * Adapts existing syntax highlighting for BaseViewer interface
 */
export class JsonHighlighter implements Highlighter {
  tokenizeLine(line: string): HighlightToken[] {
    // Use existing tokenizeLine function and adapt to HighlightToken interface
    const tokens = tokenizeLine(line, "");
    return tokens.map((token) => ({
      text: token.text,
      color: token.color,
      isMatch: token.isMatch,
    }));
  }

  applySearchHighlighting(
    tokens: HighlightToken[],
    searchTerm: string,
    isCurrentResult: boolean = false,
  ): HighlightToken[] {
    // Use existing search highlighting function
    const highlightedTokens = applySearchHighlighting(
      tokens,
      searchTerm,
      isCurrentResult,
    );
    return highlightedTokens.map((token) => ({
      text: token.text,
      color: token.color,
      isMatch: token.isMatch,
    }));
  }
}

// Export a shared instance
export const jsonHighlighter = new JsonHighlighter();
