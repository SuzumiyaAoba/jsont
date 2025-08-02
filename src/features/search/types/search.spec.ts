import type {
  SearchResult,
  SearchScope,
  SearchState,
} from "@features/search/types/search.js";
import { describe, expect, it } from "vitest";

describe("search types", () => {
  describe("SearchScope", () => {
    it("should accept valid search scope values", () => {
      const scopes: SearchScope[] = ["all", "keys", "values"];

      // Type check - this should compile without errors
      scopes.forEach((scope) => {
        expect(["all", "keys", "values"]).toContain(scope);
      });
    });
  });

  describe("SearchState", () => {
    it("should create valid search state object", () => {
      const searchState: SearchState = {
        isSearching: false,
        searchTerm: "test",
        searchResults: [],
        currentResultIndex: 0,
        searchScope: "all",
      };

      expect(searchState.isSearching).toBe(false);
      expect(searchState.searchTerm).toBe("test");
      expect(searchState.searchResults).toEqual([]);
      expect(searchState.currentResultIndex).toBe(0);
      expect(searchState.searchScope).toBe("all");
    });

    it("should work with different search scopes", () => {
      const states: SearchState[] = [
        {
          isSearching: true,
          searchTerm: "",
          searchResults: [],
          currentResultIndex: 0,
          searchScope: "all",
        },
        {
          isSearching: false,
          searchTerm: "key",
          searchResults: [],
          currentResultIndex: 0,
          searchScope: "keys",
        },
        {
          isSearching: false,
          searchTerm: "value",
          searchResults: [],
          currentResultIndex: 0,
          searchScope: "values",
        },
      ];

      states.forEach((state) => {
        expect(["all", "keys", "values"]).toContain(state.searchScope);
      });
    });
  });

  describe("SearchResult", () => {
    it("should create valid search result object", () => {
      const searchResult: SearchResult = {
        lineIndex: 5,
        columnStart: 10,
        columnEnd: 15,
        matchText: "test",
        contextLine: "This is a test line",
      };

      expect(searchResult.lineIndex).toBe(5);
      expect(searchResult.columnStart).toBe(10);
      expect(searchResult.columnEnd).toBe(15);
      expect(searchResult.matchText).toBe("test");
      expect(searchResult.contextLine).toBe("This is a test line");
    });

    it("should handle edge cases", () => {
      const edgeCases: SearchResult[] = [
        {
          lineIndex: 0,
          columnStart: 0,
          columnEnd: 0,
          matchText: "",
          contextLine: "",
        },
        {
          lineIndex: 999,
          columnStart: 50,
          columnEnd: 100,
          matchText: "long match text",
          contextLine: "Very long context line with lots of text and content",
        },
      ];

      edgeCases.forEach((result) => {
        expect(typeof result.lineIndex).toBe("number");
        expect(typeof result.columnStart).toBe("number");
        expect(typeof result.columnEnd).toBe("number");
        expect(typeof result.matchText).toBe("string");
        expect(typeof result.contextLine).toBe("string");
      });
    });
  });
});
