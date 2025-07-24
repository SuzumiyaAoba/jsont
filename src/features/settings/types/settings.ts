/**
 * Types for interactive settings TUI
 */

export interface SettingsFieldDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'select';
  description: string;
  defaultValue: unknown;
  options?: string[]; // For select type
  min?: number; // For number type
  max?: number; // For number type
  validation?: (value: unknown) => string | null;
}

export interface SettingsCategory {
  id: string;
  name: string;
  description: string;
  fields: SettingsFieldDefinition[];
}

export interface SettingsState {
  activeCategory: string;
  activeField: string | null;
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  previewValues: Record<string, unknown>;
  originalValues: Record<string, unknown>;
}

export interface SettingsAction {
  type: 'SET_ACTIVE_CATEGORY' | 'SET_ACTIVE_FIELD' | 'START_EDITING' | 'STOP_EDITING' 
       | 'UPDATE_VALUE' | 'SAVE_CHANGES' | 'CANCEL_CHANGES' | 'RESET_TO_DEFAULT';
  payload?: any;
}