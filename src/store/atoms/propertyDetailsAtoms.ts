/**
 * Jotai atoms for property details state management
 */

import type {
  PropertyDetails,
  PropertyDetailsConfig,
} from "@features/property-details/types/propertyDetails";
import { atom } from "jotai";

/**
 * Current property details (information about the selected property)
 */
export const propertyDetailsAtom = atom<PropertyDetails | null>(null);

/**
 * Property details configuration
 */
export const propertyDetailsConfigAtom = atom<PropertyDetailsConfig>({
  enabled: true,
  maxHeight: 4,
  showPath: true,
  showType: true,
  showChildrenCount: true,
});
