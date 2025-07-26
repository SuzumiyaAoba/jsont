// Components
export { BaseViewer } from "./components/BaseViewer";
export { ConfirmationDialog } from "./components/ConfirmationDialog";
export { NotificationToast } from "./components/NotificationToast";

// Hooks
export { useLineFormatting } from "./hooks/useLineFormatting";
export { useScrolling } from "./hooks/useScrolling";
export { useSearchResults } from "./hooks/useSearchResults";

// Types
export type {
  BaseViewerProps,
  ContentRenderer,
  DataProcessor,
  EmptyStateConfig,
  Highlighter,
  HighlightToken,
  LineNumberProps,
  NavigatableProps,
  SearchableProps,
} from "./types/viewer";
