/**
 * UI-agnostic search engine for JSON data
 * Handles all search-related logic without UI dependencies
 */

import type { JsonValue } from "@core/types/index";
import type { SearchScope } from "@features/search/types/search";
import {
  getNextSearchScope,
  getSearchScopeDisplayName,
  searchInJsonWithScope,
} from "@features/search/utils/searchUtils";

/**
 * Search engine state
 */
export interface SearchEngineState {
  /** Current search term */
  term: string;
  /** Current search scope */
  scope: SearchScope;
  /** Whether search is case sensitive */
  caseSensitive: boolean;
  /** Whether regex search is enabled */
  useRegex: boolean;
  /** Current match index */
  currentMatch: number;
  /** Total number of matches */
  totalMatches: number;
  /** Whether search is active */
  isActive: boolean;
  /** Search history */
  history: string[];
}

/**
 * Search result with context
 */
export interface SearchResult {
  /** Matching text segments */
  matches: Array<{
    /** Line number (0-based) */
    line: number;
    /** Column start position */
    start: number;
    /** Column end position */
    end: number;
    /** Matched text */
    text: string;
    /** Line content */
    context: string;
  }>;
  /** Total number of matches */
  total: number;
  /** Search execution time in milliseconds */
  executionTime: number;
}

/**
 * Search commands
 */
export type SearchCommand =
  | "start-search"
  | "end-search"
  | "clear-search"
  | "next-match"
  | "previous-match"
  | "cycle-scope"
  | "toggle-case-sensitive"
  | "toggle-regex";

/**
 * Result of executing a search command
 */
export interface SearchCommandResult {
  /** Whether the command was handled */
  handled: boolean;
  /** New search state */
  state: SearchEngineState;
  /** Search results if applicable */
  results?: SearchResult;
}

/**
 * Search options for configuration
 */
export interface SearchOptions {
  /** Maximum number of results to return */
  maxResults?: number;
  /** Maximum search history size */
  maxHistory?: number;
  /** Default case sensitivity */
  defaultCaseSensitive?: boolean;
  /** Default regex mode */
  defaultUseRegex?: boolean;
}

/**
 * UI-agnostic search engine for JSON data
 */
export class SearchEngine {
  private state: SearchEngineState;
  private data: JsonValue | null;
  private options: Required<SearchOptions>;

  constructor(
    data: JsonValue | null,
    options: {
      caseSensitive?: boolean;
      useRegex?: boolean;
      scope?: SearchScope;
      maxResults?: number;
      maxHistory?: number;
    } = {},
  ) {
    this.data = data;

    // Extract search-specific options from the passed options
    const {
      caseSensitive = false,
      useRegex = false,
      scope,
      maxResults = 1000,
      maxHistory = 50,
    } = options;

    this.options = {
      maxResults,
      maxHistory,
      defaultCaseSensitive: caseSensitive,
      defaultUseRegex: useRegex,
    };

    this.state = {
      term: "",
      scope: scope || "all",
      caseSensitive: this.options.defaultCaseSensitive,
      useRegex: this.options.defaultUseRegex,
      currentMatch: 0,
      totalMatches: 0,
      isActive: false,
      history: [],
    };
  }

  /**
   * Get current search state
   */
  getState(): Readonly<SearchEngineState> {
    return { ...this.state };
  }

  /**
   * Update the data being searched
   */
  updateData(data: JsonValue | null): void {
    this.data = data;
    // Re-run search if active
    if (this.state.isActive && this.state.term) {
      this.performSearch(this.state.term);
    }
  }

  /**
   * Execute a search command
   */
  executeCommand(
    command: SearchCommand,
    payload?: string,
  ): SearchCommandResult {
    let handled = false;
    let results: SearchResult | undefined;

    switch (command) {
      case "start-search":
        this.state.isActive = true;
        handled = true;
        break;

      case "end-search":
        if (payload?.trim()) {
          results = this.performSearch(payload);
          this.addToHistory(payload);
        }
        handled = true;
        break;

      case "clear-search":
        this.clearSearch();
        handled = true;
        break;

      case "next-match":
        handled = this.nextMatch();
        break;

      case "previous-match":
        handled = this.previousMatch();
        break;

      case "cycle-scope":
        this.state.scope = getNextSearchScope(this.state.scope);
        if (this.state.term) {
          results = this.performSearch(this.state.term);
        }
        handled = true;
        break;

      case "toggle-case-sensitive":
        this.state.caseSensitive = !this.state.caseSensitive;
        if (this.state.term) {
          results = this.performSearch(this.state.term);
        }
        handled = true;
        break;

      case "toggle-regex":
        this.state.useRegex = !this.state.useRegex;
        if (this.state.term) {
          results = this.performSearch(this.state.term);
        }
        handled = true;
        break;
    }

    return {
      handled,
      state: { ...this.state },
      ...(results && { results }),
    };
  }

  /**
   * Perform search with current settings
   */
  search(term: string): SearchResult {
    return this.performSearch(term);
  }

  /**
   * Get search scope display name
   */
  getScopeDisplayName(): string {
    return getSearchScopeDisplayName(this.state.scope);
  }

  /**
   * Get search navigation info
   */
  getNavigationInfo(): string {
    if (this.state.totalMatches === 0 || this.state.currentMatch < 0) {
      return "No matches";
    }
    return `${this.state.currentMatch + 1}/${this.state.totalMatches}`;
  }

  /**
   * Get search history
   */
  getHistory(): readonly string[] {
    return [...this.state.history];
  }

  /**
   * Perform the actual search
   */
  private performSearch(term: string): SearchResult {
    const startTime = performance.now();

    this.state.term = term;

    if (this.data === null || this.data === undefined || !term.trim()) {
      const emptyResult: SearchResult = {
        matches: [],
        total: 0,
        executionTime: performance.now() - startTime,
      };
      this.state.totalMatches = 0;
      this.state.currentMatch = 0;
      return emptyResult;
    }

    try {
      let searchResults: ReturnType<typeof searchInJsonWithScope>;

      if (this.state.scope === "all") {
        // Search in both keys and values for "all" scope
        const keyResults = searchInJsonWithScope(this.data, term, "keys");
        const valueResults = searchInJsonWithScope(this.data, term, "values");

        // Combine and deduplicate results
        const combinedResults = [...keyResults, ...valueResults];
        const uniqueResults = new Map();

        for (const result of combinedResults) {
          const key = `${result.lineIndex}-${result.columnStart}-${result.columnEnd}`;
          if (!uniqueResults.has(key)) {
            uniqueResults.set(key, result);
          }
        }

        searchResults = Array.from(uniqueResults.values());
      } else {
        searchResults = searchInJsonWithScope(
          this.data,
          term,
          this.state.scope,
        );
      }

      // Convert search results to our format
      const matches = searchResults
        .slice(0, this.options.maxResults)
        .map((result) => ({
          line: result.lineIndex,
          start: result.columnStart,
          end: result.columnEnd,
          text: result.matchText,
          context: result.contextLine,
        }));

      const result: SearchResult = {
        matches,
        total: searchResults.length,
        executionTime: performance.now() - startTime,
      };

      this.state.totalMatches = result.total;
      this.state.currentMatch = Math.max(0, Math.min(0, result.total - 1));

      return result;
    } catch (_error) {
      // Handle regex errors or other search errors
      const errorResult: SearchResult = {
        matches: [],
        total: 0,
        executionTime: performance.now() - startTime,
      };
      this.state.totalMatches = 0;
      this.state.currentMatch = 0;
      return errorResult;
    }
  }

  /**
   * Navigate to next match
   */
  private nextMatch(): boolean {
    if (this.state.totalMatches > 0) {
      this.state.currentMatch =
        (this.state.currentMatch + 1) % this.state.totalMatches;
      return true;
    }
    return false;
  }

  /**
   * Navigate to previous match
   */
  private previousMatch(): boolean {
    if (this.state.totalMatches > 0) {
      this.state.currentMatch =
        this.state.currentMatch > 0
          ? this.state.currentMatch - 1
          : this.state.totalMatches - 1;
      return true;
    }
    return false;
  }

  /**
   * Clear current search
   */
  private clearSearch(): void {
    this.state.term = "";
    this.state.currentMatch = 0;
    this.state.totalMatches = 0;
    this.state.isActive = false;
  }

  /**
   * Add search term to history
   */
  private addToHistory(term: string): void {
    const trimmed = term.trim();
    if (!trimmed) return;

    // Remove if already exists
    const existingIndex = this.state.history.indexOf(trimmed);
    if (existingIndex >= 0) {
      this.state.history.splice(existingIndex, 1);
    }

    // Add to beginning
    this.state.history.unshift(trimmed);

    // Limit history size
    if (this.state.history.length > this.options.maxHistory) {
      this.state.history = this.state.history.slice(0, this.options.maxHistory);
    }
  }
}
