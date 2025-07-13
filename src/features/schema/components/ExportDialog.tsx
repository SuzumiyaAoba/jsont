/**
 * Export Dialog component for specifying export destination and options
 */

import { homedir } from "node:os";
import { join } from "node:path";
import { useTextInput } from "@features/common/components/TextInput";
import { Box, Text, useInput } from "ink";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ExportOptions } from "../utils/fileExport";

export interface ExportDialogProps {
  isVisible: boolean;
  onConfirm: (options: ExportOptions) => void;
  onCancel: () => void;
  defaultFilename?: string;
}

interface ExportConfig {
  filename: string;
  outputDir: string;
  format: "json";
  baseUrl?: string;
}

export function ExportDialog({
  isVisible,
  onConfirm,
  onCancel,
  defaultFilename = "schema.json",
}: ExportDialogProps) {
  const [config, setConfig] = useState<ExportConfig>({
    filename: defaultFilename,
    outputDir: process.cwd(),
    format: "json",
    baseUrl: "https://json-schema.org/draft/2020-12/schema",
  });

  const [inputMode, setInputMode] = useState<
    "filename" | "directory" | "baseUrl" | "quickDir" | null
  >(null);

  // Use TextInput hooks for filename, directory, and baseUrl inputs
  const filenameInput = useTextInput(defaultFilename);
  const directoryInput = useTextInput(process.cwd());
  const baseUrlInput = useTextInput(
    "https://json-schema.org/draft/2020-12/schema",
  );

  // Predefined directories for quick selection
  const quickDirectories = useMemo(
    () => [
      { name: "Current Directory", path: process.cwd() },
      { name: "Home Directory", path: homedir() },
      { name: "Desktop", path: join(homedir(), "Desktop") },
      { name: "Documents", path: join(homedir(), "Documents") },
      { name: "Downloads", path: join(homedir(), "Downloads") },
    ],
    [],
  );

  const [selectedDirIndex, setSelectedDirIndex] = useState(0);

  const updateConfigFromQuickDir = useCallback(
    (index: number) => {
      const selectedDir = quickDirectories[index];
      if (selectedDir) {
        // Update both config and directoryInput to ensure sync
        setConfig((prev) => ({ ...prev, outputDir: selectedDir.path }));
        directoryInput.setValue(selectedDir.path);
      }
    },
    [quickDirectories, directoryInput],
  );

  // Ensure directoryInput stays in sync with config changes
  useEffect(() => {
    if (directoryInput.state.value !== config.outputDir) {
      directoryInput.setValue(config.outputDir);
    }
  }, [config.outputDir, directoryInput]);

  const handleInput = useCallback(
    (input, key) => {
      // Suppress all debug logs when modal is visible to prevent interference
      if (!isVisible) return;

      if (key.escape) {
        if (inputMode !== null) {
          // Exit input mode first
          setInputMode(null);
        } else {
          // Cancel dialog
          onCancel();
        }
        return;
      }

      if (key.return) {
        // Update config with current input values before confirming
        if (inputMode === "filename") {
          setConfig((prev) => ({
            ...prev,
            filename: filenameInput.state.value,
          }));
        } else if (inputMode === "directory") {
          setConfig((prev) => ({
            ...prev,
            outputDir: directoryInput.state.value,
          }));
        } else if (inputMode === "baseUrl") {
          setConfig((prev) => ({
            ...prev,
            baseUrl: baseUrlInput.state.value,
          }));
        }

        // Always confirm export when Enter is pressed using current values
        const finalFilename =
          inputMode === "filename"
            ? filenameInput.state.value
            : config.filename;
        const finalDirectory =
          inputMode === "directory"
            ? directoryInput.state.value
            : config.outputDir;
        const finalBaseUrl =
          inputMode === "baseUrl" ? baseUrlInput.state.value : config.baseUrl;

        onConfirm({
          filename: finalFilename,
          outputDir: finalDirectory,
          format: config.format,
          baseUrl: finalBaseUrl,
        });
        return;
      }

      // Quick directory selection (1-5) - available when not in text input mode or in quickDir mode
      if (
        input >= "1" &&
        input <= "5" &&
        (inputMode === null || inputMode === "quickDir")
      ) {
        const index = parseInt(input, 10) - 1;
        if (index < quickDirectories.length) {
          setSelectedDirIndex(index);
          updateConfigFromQuickDir(index);
        }
        return;
      }

      if (key.tab) {
        // Cycle through filename, directory, baseUrl, and quickDir input modes
        if (inputMode === null) {
          setInputMode("filename");
        } else if (inputMode === "filename") {
          setInputMode("directory");
        } else if (inputMode === "directory") {
          setInputMode("baseUrl");
        } else if (inputMode === "baseUrl") {
          setInputMode("quickDir");
        } else {
          setInputMode("filename");
        }
        return;
      }

      // Text input handling using TextInput hooks
      if (inputMode === "filename") {
        filenameInput.handleKeyInput(input, key);
        return;
      }

      if (inputMode === "directory") {
        directoryInput.handleKeyInput(input, key);
        return;
      }

      if (inputMode === "baseUrl") {
        baseUrlInput.handleKeyInput(input, key);
        return;
      }

      // Quick directory navigation mode
      if (inputMode === "quickDir") {
        if (input === "j" && !key.ctrl) {
          // Move down in quick directories and update directory
          const newIndex = Math.min(
            selectedDirIndex + 1,
            quickDirectories.length - 1,
          );
          setSelectedDirIndex(newIndex);
          updateConfigFromQuickDir(newIndex);
          return;
        }
        if (input === "k" && !key.ctrl) {
          // Move up in quick directories and update directory
          const newIndex = Math.max(selectedDirIndex - 1, 0);
          setSelectedDirIndex(newIndex);
          updateConfigFromQuickDir(newIndex);
          return;
        }
        if (key.return) {
          // Select current directory (already updated by j/k)
          updateConfigFromQuickDir(selectedDirIndex);
          return;
        }
        return;
      }
    },
    [
      isVisible,
      inputMode,
      onCancel,
      onConfirm,
      config,
      filenameInput,
      directoryInput,
      baseUrlInput,
      quickDirectories,
      selectedDirIndex,
      updateConfigFromQuickDir,
    ],
  );

  useInput(handleInput, {
    isActive: isVisible,
  });

  if (!isVisible) {
    return null;
  }

  const currentFilename =
    inputMode === "filename" ? filenameInput.state.value : config.filename;
  const currentDirectory = directoryInput.state.value || config.outputDir;
  const currentBaseUrl =
    inputMode === "baseUrl" ? baseUrlInput.state.value : config.baseUrl;
  const fullPath = join(currentDirectory, currentFilename);

  // Get display text with cursor for active input
  const filenameDisplay = filenameInput.getDisplayText(
    inputMode === "filename",
  );
  const directoryDisplay = directoryInput.getDisplayText(
    inputMode === "directory",
  );
  const baseUrlDisplay = baseUrlInput.getDisplayText(inputMode === "baseUrl");

  return (
    <Box
      borderStyle="double"
      borderColor="yellow"
      padding={1}
      flexDirection="column"
      width="100%"
      minHeight={12}
    >
      <Box marginBottom={1}>
        <Text color="yellow" bold>
          📁 Export JSON Schema
        </Text>
      </Box>

      <Box flexDirection="column" gap={1}>
        {/* Filename Input */}
        <Box>
          <Text color="cyan">Filename: </Text>
          {inputMode === "filename" ? (
            <Box>
              <Text color="white">{filenameDisplay.beforeCursor}</Text>
              <Text color="white" backgroundColor="blue">
                {filenameDisplay.atCursor}
              </Text>
              <Text color="white">{filenameDisplay.afterCursor}</Text>
            </Box>
          ) : (
            <Text color="gray">{currentFilename}</Text>
          )}
        </Box>

        {/* Directory Input */}
        <Box>
          <Text color="cyan">Directory: </Text>
          {inputMode === "directory" ? (
            <Box>
              <Text color="white">{directoryDisplay.beforeCursor}</Text>
              <Text color="white" backgroundColor="blue">
                {directoryDisplay.atCursor}
              </Text>
              <Text color="white">{directoryDisplay.afterCursor}</Text>
            </Box>
          ) : (
            <Text color="gray">{currentDirectory}</Text>
          )}
        </Box>

        {/* Base URL Input */}
        <Box>
          <Text color="cyan">Base URL: </Text>
          {inputMode === "baseUrl" ? (
            <Box>
              <Text color="white">{baseUrlDisplay.beforeCursor}</Text>
              <Text color="white" backgroundColor="blue">
                {baseUrlDisplay.atCursor}
              </Text>
              <Text color="white">{baseUrlDisplay.afterCursor}</Text>
            </Box>
          ) : (
            <Text color="gray">{currentBaseUrl || "Not set"}</Text>
          )}
        </Box>

        {/* Full Path Preview */}
        <Box marginTop={1}>
          <Text color="green">Full Path: </Text>
          <Text color="white" dimColor>
            {fullPath}
          </Text>
        </Box>

        {/* Quick Directory Selection */}
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellow">
            Quick Directories
            {inputMode === "quickDir" ? " (j/k: navigate, Enter: select)" : ":"}
          </Text>
          {quickDirectories.map((dir, index) => (
            <Box key={dir.name}>
              <Text color="cyan">{index + 1}. </Text>
              <Text color={selectedDirIndex === index ? "yellow" : "gray"}>
                {dir.name}: {dir.path}
              </Text>
            </Box>
          ))}
        </Box>

        {/* Instructions */}
        <Box marginTop={1} borderStyle="single" borderColor="gray" padding={1}>
          <Box flexDirection="column">
            <Text color="gray" dimColor>
              Tab: Switch field | 1-5: Quick directory | j/k: Navigate dirs |
              Enter: Confirm/Select | Esc: Exit/Cancel
            </Text>
            <Text color="gray" dimColor>
              Type to edit | C-a: Start | C-e: End | C-f: Forward | C-b: Back
            </Text>
            <Text color="gray" dimColor>
              C-k: Kill to end | C-u: Kill to start | C-w: Kill word | C-d:
              Delete char
            </Text>
            <Text color="gray" dimColor>
              Backspace/Del: Delete left/right
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
