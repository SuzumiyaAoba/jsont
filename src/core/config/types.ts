/**
 * Configuration types for jsont application
 */

export interface NavigationKeys {
  up: string[];
  down: string[];
  pageUp: string[];
  pageDown: string[];
  top: string[];
  bottom: string[];
}

export interface ModeKeys {
  search: string[];
  schema: string[];
  tree: string[];
  collapsible: string[];
  jq: string[];
  lineNumbers: string[];
  debug: string[];
  help: string[];
  export: string[];
  exportData: string[];
  quit: string[];
}

export interface SearchKeys {
  next: string[];
  previous: string[];
  exit: string[];
}

export interface KeyBindings {
  navigation: NavigationKeys;
  modes: ModeKeys;
  search: SearchKeys;
}

export interface JsonDisplayConfig {
  /** Number of spaces for indentation */
  indent: number;
  /** Use tabs instead of spaces for indentation */
  useTabs: boolean;
  /** Maximum line length before wrapping */
  maxLineLength: number;
}

export interface TreeDisplayConfig {
  /** Show array indices in tree view */
  showArrayIndices: boolean;
  /** Show primitive values in tree view */
  showPrimitiveValues: boolean;
  /** Maximum length for displaying values */
  maxValueLength: number;
  /** Use Unicode tree characters */
  useUnicodeTree: boolean;
  /** Show schema types in tree view */
  showSchemaTypes: boolean;
}

export interface InterfaceConfig {
  /** Show line numbers by default */
  showLineNumbers: boolean;
  /** Enable debug mode by default */
  debugMode: boolean;
  /** Default terminal height for calculations */
  defaultHeight: number;
  /** Status bar configuration */
  showStatusBar: boolean;
  /** UI appearance configuration */
  appearance: AppearanceConfig;
}

/** UI appearance configuration */
export interface AppearanceConfig {
  /** Border style configuration */
  borders: BorderConfig;
  /** Color theme configuration */
  colors: ColorConfig;
  /** Component height configuration */
  heights: HeightConfig;
}

/** Border appearance configuration */
export interface BorderConfig {
  /** Default border style */
  style: "single" | "double" | "round" | "classic";
  /** Border colors for different components */
  colors: {
    /** Main content area border color */
    mainContent: string;
    /** Search bar border color */
    search: string;
    /** JQ input border color (when no dynamic status) */
    jq: string;
    /** Settings panel border colors */
    settings: {
      /** Normal state border color */
      normal: string;
      /** Edit mode border color */
      editing: string;
    };
    /** Help viewer border color */
    help: string;
    /** Debug components border color */
    debug: string;
    /** Property details border color */
    propertyDetails: string;
    /** Export dialog border color */
    export: string;
  };
}

/** Color theme configuration */
export interface ColorConfig {
  /** Primary color for headers and emphasis */
  primary: string;
  /** Secondary color for highlights */
  secondary: string;
  /** Success state color */
  success: string;
  /** Warning state color */
  warning: string;
  /** Error state color */
  error: string;
  /** Info state color */
  info: string;
  /** Muted/disabled color */
  muted: string;
  /** Text colors */
  text: {
    /** Primary text color */
    primary: string;
    /** Secondary text color */
    secondary: string;
    /** Dimmed text color */
    dimmed: string;
  };
}

/** Component height configuration */
export interface HeightConfig {
  /** Search bar height (including borders) */
  searchBar: number;
  /** JQ input component height (including borders) */
  jqInput: number;
  /** Property details display height */
  propertyDetails: number;
  /** Settings header height */
  settingsHeader: number;
}

export interface SearchConfig {
  /** Case sensitive search by default */
  caseSensitive: boolean;
  /** Enable regex search by default */
  regex: boolean;
  /** Highlight search results */
  highlight: boolean;
}

export interface NavigationConfig {
  /** Enable half-page scrolling */
  halfPageScroll: boolean;
  /** Auto-scroll to search results */
  autoScroll: boolean;
  /** Scroll offset from edges */
  scrollOffset: number;
}

export interface DisplayConfig {
  json: JsonDisplayConfig;
  tree: TreeDisplayConfig;
  interface: InterfaceConfig;
}

export interface BehaviorConfig {
  search: SearchConfig;
  navigation: NavigationConfig;
}

export interface JsontConfig {
  keybindings: KeyBindings;
  display: DisplayConfig;
  behavior: BehaviorConfig;
}

/**
 * Partial configuration type for user overrides
 */
export type PartialJsontConfig = {
  [K in keyof JsontConfig]?: {
    [P in keyof JsontConfig[K]]?: Partial<JsontConfig[K][P]>;
  };
};
