/**
 * Hook for managing property details state
 */

import type {
  PropertyDetails,
  PropertyDetailsConfig,
} from "@features/property-details/types/propertyDetails";
import {
  propertyDetailsAtom,
  propertyDetailsConfigAtom,
} from "@store/atoms/propertyDetailsAtoms";
import { useAtom } from "jotai";
import { useCallback } from "react";

/**
 * Hook for property details state management
 */
export function usePropertyDetails() {
  const [details, setDetails] = useAtom(propertyDetailsAtom);
  const [config, setConfig] = useAtom(propertyDetailsConfigAtom);

  const updatePropertyDetails = useCallback(
    (newDetails: PropertyDetails | null) => {
      setDetails(newDetails);
    },
    [setDetails],
  );

  const updatePropertyDetailsConfig = useCallback(
    (newConfig: Partial<PropertyDetailsConfig>) => {
      setConfig((prev) => ({ ...prev, ...newConfig }));
    },
    [setConfig],
  );

  const togglePropertyDetails = useCallback(() => {
    setConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, [setConfig]);

  const clearPropertyDetails = useCallback(() => {
    setDetails(null);
  }, [setDetails]);

  return {
    details,
    config,
    updatePropertyDetails,
    updatePropertyDetailsConfig,
    togglePropertyDetails,
    clearPropertyDetails,
  };
}
