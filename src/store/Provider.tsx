/**
 * Jotai Provider component for the application
 */

import { Provider as JotaiRootProvider } from "jotai";
import type { ReactNode } from "react";

interface JotaiProviderProps {
  children: ReactNode;
}

export function JotaiProvider({ children }: JotaiProviderProps) {
  return <JotaiRootProvider>{children}</JotaiRootProvider>;
}
