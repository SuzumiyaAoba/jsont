/**
 * Property details feature exports
 */

// Components
export {
  CompactPropertyDetailsDisplay,
  PropertyDetailsDisplay,
} from "./components/PropertyDetailsDisplay";

// Types
export type {
  PropertyDetails,
  PropertyDetailsConfig,
} from "./types/propertyDetails";

// Utils
export {
  extractPropertyDetailsFromPath,
  extractPropertyDetailsFromTreeLine,
} from "./utils/propertyDetailsExtractor";
