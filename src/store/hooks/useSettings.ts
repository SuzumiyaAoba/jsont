/**
 * Settings hooks
 */

import {
  closeSettingsAtom,
  openSettingsAtom,
  resetPreviewValuesAtom,
  saveSettingsAtom,
  setActiveCategoryAtom,
  setActiveFieldAtom,
  settingsStateAtom,
  settingsVisibleAtom,
  startEditingAtom,
  stopEditingAtom,
  updatePreviewValueAtom,
} from "@store/atoms/settings";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

export const useSettingsVisible = () => useAtomValue(settingsVisibleAtom);

export const useSettingsState = () => useAtom(settingsStateAtom);

export const useOpenSettings = () => useSetAtom(openSettingsAtom);

export const useCloseSettings = () => useSetAtom(closeSettingsAtom);

export const useSetActiveCategory = () => useSetAtom(setActiveCategoryAtom);

export const useSetActiveField = () => useSetAtom(setActiveFieldAtom);

export const useStartEditing = () => useSetAtom(startEditingAtom);

export const useStopEditing = () => useSetAtom(stopEditingAtom);

export const useUpdatePreviewValue = () => useSetAtom(updatePreviewValueAtom);

export const useResetPreviewValues = () => useSetAtom(resetPreviewValuesAtom);

export const useSaveSettings = () => useSetAtom(saveSettingsAtom);
