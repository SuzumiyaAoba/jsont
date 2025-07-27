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
  defaultFormat?: "json" | "schema" | "yaml" | "csv" | "xml" | "sql";
}

interface ExportConfig {
  filename: string;
  outputDir: string;
  format: "json" | "schema" | "yaml" | "csv" | "xml" | "sql";
  baseUrl?: string;
  csvOptions?: {
    delimiter: string;
    includeHeaders: boolean;
    flattenArrays: boolean;
  };
  xmlOptions?: {
    rootElement: string;
    arrayItemElement: string;
    indent: number;
    declaration: boolean;
  };
  sqlOptions?: {
    tableName: string;
    dialect: "postgresql" | "mysql" | "sqlite" | "mssql";
    includeCreateTable: boolean;
    batchSize: number;
    escapeIdentifiers: boolean;
  };
}

/**
 * Get file extension for the given format
 */
function getExtensionForFormat(format: string): string {
  const extensionMap: Record<string, string> = {
    json: ".json",
    schema: ".json",
    yaml: ".yaml",
    csv: ".csv",
    xml: ".xml",
    sql: ".sql",
  };
  return extensionMap[format] || ".json";
}

/**
 * Update filename extension based on format
 */
function updateFilenameExtension(filename: string, newFormat: string): string {
  const newExtension = getExtensionForFormat(newFormat);
  const baseName = filename.replace(/\.[^/.]+$/, ""); // Remove existing extension
  return `${baseName}${newExtension}`;
}

export function ExportDialog({
  isVisible,
  onConfirm,
  onCancel,
  defaultFilename = "schema.json",
  defaultFormat = "json",
}: ExportDialogProps) {
  const [config, setConfig] = useState<ExportConfig>(() => {
    const initialFormat = defaultFormat;
    const initialFilename = updateFilenameExtension(
      defaultFilename,
      initialFormat,
    );

    return {
      filename: initialFilename,
      outputDir: process.cwd(),
      format: initialFormat,
      baseUrl: "https://json-schema.org/draft/2020-12/schema",
      csvOptions: {
        delimiter: ",",
        includeHeaders: true,
        flattenArrays: true,
      },
      xmlOptions: {
        rootElement: "root",
        arrayItemElement: "item",
        indent: 2,
        declaration: true,
      },
      sqlOptions: {
        tableName: "data",
        dialect: "postgresql",
        includeCreateTable: true,
        batchSize: 1000,
        escapeIdentifiers: true,
      },
    };
  });

  const [inputMode, setInputMode] = useState<
    | "filename"
    | "directory"
    | "baseUrl"
    | "format"
    | "quickDir"
    | "csvOptions"
    | "xmlOptions"
    | "sqlOptions"
    | null
  >("filename");

  // Use TextInput hooks for filename, directory, and baseUrl inputs
  const filenameInput = useTextInput(config.filename);

  // Update filename when defaultFilename or defaultFormat changes
  useEffect(() => {
    const updatedFormat = defaultFormat;
    const updatedFilename = updateFilenameExtension(
      defaultFilename,
      updatedFormat,
    );
    setConfig((prev) => ({
      ...prev,
      filename: updatedFilename,
      format: updatedFormat,
    }));
    filenameInput.setValue(updatedFilename);
    filenameInput.setCursorPosition(updatedFilename.length);
  }, [
    defaultFilename,
    defaultFormat,
    filenameInput.setValue,
    filenameInput.setCursorPosition,
  ]);
  const directoryInput = useTextInput(process.cwd());
  const baseUrlInput = useTextInput(
    "https://json-schema.org/draft/2020-12/schema",
  );

  // Keep track of custom directory path (persists even when not currently selected)
  const [customDirectoryPath, setCustomDirectoryPath] = useState<string | null>(
    null,
  );

  // Check if directory input is a custom path (not one of the predefined ones)
  const isCustomDirectory = useMemo(() => {
    const currentPath = directoryInput.state.text;
    const predefinedPaths = [
      process.cwd(),
      homedir(),
      join(homedir(), "Desktop"),
      join(homedir(), "Documents"),
      join(homedir(), "Downloads"),
    ];
    return !predefinedPaths.includes(currentPath);
  }, [directoryInput.state.text]);

  // Update custom directory path when a custom path is set
  useEffect(() => {
    if (isCustomDirectory) {
      setCustomDirectoryPath(directoryInput.state.text);
    }
  }, [isCustomDirectory, directoryInput.state.text]);

  // Predefined directories for quick selection
  const quickDirectories = useMemo(() => {
    const baseDirectories = [
      { name: "Current Directory", path: process.cwd() },
      { name: "Home Directory", path: homedir() },
      { name: "Desktop", path: join(homedir(), "Desktop") },
      { name: "Documents", path: join(homedir(), "Documents") },
      { name: "Downloads", path: join(homedir(), "Downloads") },
    ];

    // Add custom directory if one has been set (show it even if not currently selected)
    if (customDirectoryPath) {
      baseDirectories.push({
        name: "Custom",
        path: customDirectoryPath,
      });
    }

    return baseDirectories;
  }, [customDirectoryPath]);

  const [selectedDirIndex, setSelectedDirIndex] = useState(0);

  // Update selectedDirIndex when current directory matches one of the quick directories
  useEffect(() => {
    const currentPath = directoryInput.state.text;
    const matchingIndex = quickDirectories.findIndex(
      (dir) => dir.path === currentPath,
    );
    if (matchingIndex !== -1 && matchingIndex !== selectedDirIndex) {
      setSelectedDirIndex(matchingIndex);
    }
  }, [directoryInput.state.text, quickDirectories, selectedDirIndex]);

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

  // Ensure directoryInput stays in sync with config changes, but only when not in directory edit mode
  useEffect(() => {
    if (
      inputMode !== "directory" &&
      directoryInput.state.text !== config.outputDir
    ) {
      directoryInput.setValue(config.outputDir);
    }
  }, [config.outputDir, directoryInput, inputMode]);

  // Update config when directory input changes (for real-time sync)
  useEffect(() => {
    if (directoryInput.state.text !== config.outputDir) {
      setConfig((prev) => ({ ...prev, outputDir: directoryInput.state.text }));
    }
  }, [directoryInput.state.text, config.outputDir]);

  const handleInput = useCallback(
    (
      input: string,
      key: {
        escape?: boolean;
        return?: boolean;
        tab?: boolean;
        ctrl?: boolean;
      },
    ) => {
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
            filename: filenameInput.state.text,
          }));
        } else if (inputMode === "directory") {
          setConfig((prev) => ({
            ...prev,
            outputDir: directoryInput.state.text,
          }));
        } else if (inputMode === "baseUrl") {
          setConfig((prev) => ({
            ...prev,
            baseUrl: baseUrlInput.state.text,
          }));
        }

        // Always confirm export when Enter is pressed using current values
        const finalFilename =
          inputMode === "filename" ? filenameInput.state.text : config.filename;
        const finalDirectory =
          inputMode === "directory"
            ? directoryInput.state.text
            : config.outputDir;
        const finalBaseUrl =
          inputMode === "baseUrl" ? baseUrlInput.state.text : config.baseUrl;

        const exportOptions: ExportOptions = {
          filename: finalFilename,
          outputDir: finalDirectory,
          format: config.format,
        };
        if (finalBaseUrl) {
          exportOptions.baseUrl = finalBaseUrl;
        }
        if (config.format === "csv" && config.csvOptions) {
          exportOptions.csvOptions = config.csvOptions;
        }
        if (config.format === "xml" && config.xmlOptions) {
          exportOptions.xmlOptions = config.xmlOptions;
        }
        if (config.format === "sql" && config.sqlOptions) {
          exportOptions.sqlOptions = config.sqlOptions;
        }
        onConfirm(exportOptions);
        return;
      }

      // Format selection (j/s/y/c) - available when not in text input mode or in format mode
      if (
        (input === "j" ||
          input === "s" ||
          input === "y" ||
          input === "c" ||
          input === "x" ||
          input === "q") &&
        (inputMode === null || inputMode === "format")
      ) {
        let newFormat: string;
        if (input === "j") {
          newFormat = "json";
        } else if (input === "s") {
          newFormat = "schema";
        } else if (input === "y") {
          newFormat = "yaml";
        } else if (input === "c") {
          newFormat = "csv";
        } else if (input === "x") {
          newFormat = "xml";
        } else if (input === "q") {
          newFormat = "sql";
        } else {
          return;
        }

        // Update format and filename extension
        setConfig((prev) => {
          const currentFilename = prev.filename;
          const updatedFilename = updateFilenameExtension(
            currentFilename,
            newFormat,
          );

          return {
            ...prev,
            format: newFormat as ExportConfig["format"],
            filename: updatedFilename,
          };
        });

        // Update the filename input to reflect the new extension
        const updatedFilename = updateFilenameExtension(
          filenameInput.state.text,
          newFormat,
        );
        filenameInput.setValue(updatedFilename);
        filenameInput.setCursorPosition(updatedFilename.length);
        return;
      }

      // Quick directory selection (1-6) - available when not in text input mode or in quickDir mode
      if (
        input >= "1" &&
        input <= "6" &&
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
        // Cycle through filename, directory, format, baseUrl (only for schema), and quickDir input modes
        if (inputMode === null) {
          setInputMode("filename");
        } else if (inputMode === "filename") {
          setInputMode("directory");
        } else if (inputMode === "directory") {
          setInputMode("format");
        } else if (inputMode === "format") {
          // Skip baseUrl if format is not schema
          if (config.format === "schema") {
            setInputMode("baseUrl");
          } else {
            setInputMode("quickDir");
          }
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
    inputMode === "filename" ? filenameInput.state.text : config.filename;
  const currentDirectory = directoryInput.state.text || config.outputDir;
  const currentBaseUrl =
    inputMode === "baseUrl" ? baseUrlInput.state.text : config.baseUrl;
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
          📁 Export Data
          {config.format === "json" && " (Data)"}
          {config.format === "schema" && " (Schema)"}
          {config.format === "yaml" && " (YAML)"}
          {config.format === "csv" && " (CSV)"}
          {config.format === "xml" && " (XML)"}
          {config.format === "sql" && " (SQL)"}
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

        {/* Format Selection */}
        <Box>
          <Text color="cyan">Format: </Text>
          <Text color={inputMode === "format" ? "yellow" : "gray"}>
            {config.format === "json" && "Data"}
            {config.format === "schema" && "Schema"}
            {config.format === "yaml" && "YAML"}
            {config.format === "csv" && "CSV"}
            {config.format === "xml" && "XML"}
            {config.format === "sql" && "SQL"}
            {inputMode === "format"
              ? " (j: Data, s: Schema, y: YAML, c: CSV, x: XML, q: SQL)"
              : ""}
          </Text>
        </Box>

        {/* Base URL Input - only show for schema format */}
        {config.format === "schema" && (
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
        )}

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
              Tab: Switch field | j/s/y/c: Format | 1-6: Quick directory | j/k:
              Navigate dirs | Enter: Confirm/Select | Esc: Exit/Cancel
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
