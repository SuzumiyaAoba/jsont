/**
 * Export Dialog component for specifying export destination and options
 */

import { homedir } from "node:os";
import { join } from "node:path";
import { Box, Text, useInput } from "ink";
import { useCallback, useMemo, useState } from "react";
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
  });

  const [inputMode, setInputMode] = useState<"filename" | "directory">(
    "filename",
  );
  const [filenameInput, setFilenameInput] = useState(defaultFilename);
  const [directoryInput, setDirectoryInput] = useState(process.cwd());

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

  const handleConfirm = useCallback(() => {
    const finalFilename =
      inputMode === "filename" ? filenameInput : config.filename;
    const finalDirectory =
      inputMode === "directory" ? directoryInput : config.outputDir;

    onConfirm({
      filename: finalFilename,
      outputDir: finalDirectory,
      format: config.format,
    });
  }, [config, filenameInput, directoryInput, inputMode, onConfirm]);

  const updateConfigFromQuickDir = useCallback(
    (index: number) => {
      const selectedDir = quickDirectories[index];
      if (selectedDir) {
        setConfig((prev) => ({ ...prev, outputDir: selectedDir.path }));
        setDirectoryInput(selectedDir.path);
      }
    },
    [quickDirectories],
  );

  useInput((input, key) => {
    if (!isVisible) return;

    if (key.escape) {
      onCancel();
      return;
    }

    if (key.return) {
      if (inputMode === "filename" || inputMode === "directory") {
        // Finish editing current field
        if (inputMode === "filename") {
          setConfig((prev) => ({ ...prev, filename: filenameInput }));
        } else {
          setConfig((prev) => ({ ...prev, outputDir: directoryInput }));
        }
        setInputMode("filename"); // Reset to default mode
      } else {
        handleConfirm();
      }
      return;
    }

    if (key.tab) {
      // Toggle between filename and directory input
      if (inputMode === "filename") {
        setInputMode("directory");
      } else {
        setInputMode("filename");
      }
      return;
    }

    // Quick directory selection (1-5)
    if (
      input >= "1" &&
      input <= "5" &&
      inputMode !== "filename" &&
      inputMode !== "directory"
    ) {
      const index = parseInt(input, 10) - 1;
      if (index < quickDirectories.length) {
        setSelectedDirIndex(index);
        updateConfigFromQuickDir(index);
      }
      return;
    }

    // Text input handling
    if (inputMode === "filename") {
      if (key.backspace || key.delete) {
        setFilenameInput((prev) => prev.slice(0, -1));
      } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
        setFilenameInput((prev) => prev + input);
      }
    } else if (inputMode === "directory") {
      if (key.backspace || key.delete) {
        setDirectoryInput((prev) => prev.slice(0, -1));
      } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
        setDirectoryInput((prev) => prev + input);
      }
    }
  });

  if (!isVisible) {
    return null;
  }

  const currentFilename =
    inputMode === "filename" ? filenameInput : config.filename;
  const currentDirectory =
    inputMode === "directory" ? directoryInput : config.outputDir;
  const fullPath = join(currentDirectory, currentFilename);

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
          <Text
            color={inputMode === "filename" ? "white" : "gray"}
            {...(inputMode === "filename" && { backgroundColor: "blue" })}
          >
            {currentFilename}
          </Text>
          {inputMode === "filename" && <Text color="yellow">█</Text>}
        </Box>

        {/* Directory Input */}
        <Box>
          <Text color="cyan">Directory: </Text>
          <Text
            color={inputMode === "directory" ? "white" : "gray"}
            {...(inputMode === "directory" && { backgroundColor: "blue" })}
          >
            {currentDirectory}
          </Text>
          {inputMode === "directory" && <Text color="yellow">█</Text>}
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
          <Text color="yellow">Quick Directories:</Text>
          {quickDirectories.map((dir, index) => (
            <Box key={dir.name}>
              <Text color="cyan">{index + 1}. </Text>
              <Text
                color={selectedDirIndex === index ? "white" : "gray"}
                {...(selectedDirIndex === index && { backgroundColor: "blue" })}
              >
                {dir.name}: {dir.path}
              </Text>
            </Box>
          ))}
        </Box>

        {/* Instructions */}
        <Box marginTop={1} borderStyle="single" borderColor="gray" padding={1}>
          <Box flexDirection="column">
            <Text color="gray" dimColor>
              Tab: Switch field | 1-5: Quick directory | Enter: Confirm | Esc:
              Cancel
            </Text>
            <Text color="gray" dimColor>
              Type to edit filename/directory | Backspace: Delete character
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
