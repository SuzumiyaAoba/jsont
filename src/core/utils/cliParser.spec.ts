/**
 * Tests for CLI argument parser
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseCliArgs, showHelp, showVersion } from "./cliParser";

describe("CLI Parser", () => {
  describe("parseCliArgs", () => {
    it("should return empty object for no arguments", () => {
      const result = parseCliArgs(["node", "script"]);
      expect(result).toEqual({});
    });

    it("should parse help flags", () => {
      expect(parseCliArgs(["node", "script", "--help"])).toEqual({
        help: true,
      });
      expect(parseCliArgs(["node", "script", "-h"])).toEqual({
        help: true,
      });
    });

    it("should parse version flags", () => {
      expect(parseCliArgs(["node", "script", "--version"])).toEqual({
        version: true,
      });
      expect(parseCliArgs(["node", "script", "-v"])).toEqual({
        version: true,
      });
    });

    it("should parse file path", () => {
      const result = parseCliArgs(["node", "script", "test.json"]);
      expect(result).toEqual({
        filePath: "test.json",
      });
    });

    it("should parse file path with relative path", () => {
      const result = parseCliArgs(["node", "script", "./data/test.json"]);
      expect(result).toEqual({
        filePath: "./data/test.json",
      });
    });

    it("should parse file path with absolute path", () => {
      const result = parseCliArgs(["node", "script", "/path/to/test.json"]);
      expect(result).toEqual({
        filePath: "/path/to/test.json",
      });
    });

    describe("view mode options", () => {
      it("should parse --mode with valid mode", () => {
        const result = parseCliArgs(["node", "script", "--mode", "tree"]);
        expect(result).toEqual({
          viewMode: "tree",
        });
      });

      it("should parse -m with valid mode", () => {
        const result = parseCliArgs(["node", "script", "-m", "schema"]);
        expect(result).toEqual({
          viewMode: "schema",
        });
      });

      it("should parse --tree shorthand", () => {
        const result = parseCliArgs(["node", "script", "--tree"]);
        expect(result).toEqual({
          viewMode: "tree",
        });
      });

      it("should parse -t shorthand", () => {
        const result = parseCliArgs(["node", "script", "-t"]);
        expect(result).toEqual({
          viewMode: "tree",
        });
      });

      it("should parse --collapsible shorthand", () => {
        const result = parseCliArgs(["node", "script", "--collapsible"]);
        expect(result).toEqual({
          viewMode: "collapsible",
        });
      });

      it("should parse -c shorthand", () => {
        const result = parseCliArgs(["node", "script", "-c"]);
        expect(result).toEqual({
          viewMode: "collapsible",
        });
      });

      it("should parse --schema shorthand", () => {
        const result = parseCliArgs(["node", "script", "--schema"]);
        expect(result).toEqual({
          viewMode: "schema",
        });
      });

      it("should parse -s shorthand", () => {
        const result = parseCliArgs(["node", "script", "-s"]);
        expect(result).toEqual({
          viewMode: "schema",
        });
      });

      it("should parse --settings", () => {
        const result = parseCliArgs(["node", "script", "--settings"]);
        expect(result).toEqual({
          viewMode: "settings",
        });
      });

      it("should parse all valid view modes with --mode", () => {
        const validModes = ["raw", "tree", "collapsible", "schema", "settings"];

        for (const mode of validModes) {
          const result = parseCliArgs(["node", "script", "--mode", mode]);
          expect(result).toEqual({
            viewMode: mode,
          });
        }
      });
    });

    describe("combined arguments", () => {
      it("should parse file path with view mode", () => {
        const result = parseCliArgs(["node", "script", "--tree", "test.json"]);
        expect(result).toEqual({
          viewMode: "tree",
          filePath: "test.json",
        });
      });

      it("should parse multiple flags", () => {
        const result = parseCliArgs([
          "node",
          "script",
          "--mode",
          "schema",
          "data.json",
        ]);
        expect(result).toEqual({
          viewMode: "schema",
          filePath: "data.json",
        });
      });

      it("should handle mixed short and long options", () => {
        const result = parseCliArgs(["node", "script", "-t", "data.json"]);
        expect(result).toEqual({
          viewMode: "tree",
          filePath: "data.json",
        });
      });
    });

    describe("error cases", () => {
      it("should throw error for --mode without value", () => {
        expect(() => {
          parseCliArgs(["node", "script", "--mode"]);
        }).toThrow(
          "--mode option requires a value. Valid modes: raw, tree, collapsible, schema, settings",
        );
      });

      it("should throw error for -m without value", () => {
        expect(() => {
          parseCliArgs(["node", "script", "-m"]);
        }).toThrow(
          "--mode option requires a value. Valid modes: raw, tree, collapsible, schema, settings",
        );
      });

      it("should throw error for invalid view mode", () => {
        expect(() => {
          parseCliArgs(["node", "script", "--mode", "invalid"]);
        }).toThrow(
          "Invalid view mode: invalid. Valid modes: raw, tree, collapsible, schema, settings",
        );
      });

      it("should throw error for unknown option", () => {
        expect(() => {
          parseCliArgs(["node", "script", "--unknown"]);
        }).toThrow("Unknown option: --unknown");
      });

      it("should throw error for unknown short option", () => {
        expect(() => {
          parseCliArgs(["node", "script", "-x"]);
        }).toThrow("Unknown option: -x");
      });
    });

    describe("edge cases", () => {
      it("should handle empty argv array", () => {
        const result = parseCliArgs([]);
        expect(result).toEqual({});
      });

      it("should handle argv with only script path", () => {
        const result = parseCliArgs(["node"]);
        expect(result).toEqual({});
      });

      it("should handle argv with empty string", () => {
        const result = parseCliArgs(["node", "script", ""]);
        expect(result).toEqual({});
      });

      it("should treat files that start with dash as unknown options", () => {
        expect(() => {
          parseCliArgs(["node", "script", "-file.json"]);
        }).toThrow("Unknown option: -file.json");
      });

      it("should handle multiple file paths (last one wins)", () => {
        const result = parseCliArgs([
          "node",
          "script",
          "first.json",
          "second.json",
        ]);
        expect(result).toEqual({
          filePath: "second.json",
        });
      });

      it("should handle view mode override (last one wins)", () => {
        const result = parseCliArgs(["node", "script", "--tree", "--schema"]);
        expect(result).toEqual({
          viewMode: "schema",
        });
      });
    });

    describe("process.argv default", () => {
      beforeEach(() => {
        // Mock process.argv
        vi.stubGlobal("process", {
          ...process,
          argv: ["node", "jsont", "--help"],
        });
      });

      it("should use process.argv when no argv provided", () => {
        const result = parseCliArgs();
        expect(result).toEqual({
          help: true,
        });
      });
    });
  });

  describe("showHelp", () => {
    it("should output comprehensive help text", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      showHelp();

      expect(consoleSpy).toHaveBeenCalledOnce();
      const helpText = consoleSpy.mock.calls[0]?.[0];

      // Check for key sections
      expect(helpText).toContain("jsont - Terminal JSON Viewer");
      expect(helpText).toContain("USAGE:");
      expect(helpText).toContain("OPTIONS:");
      expect(helpText).toContain("VIEW MODES:");
      expect(helpText).toContain("EXAMPLES:");
      expect(helpText).toContain("KEYBOARD SHORTCUTS:");

      // Check for specific options
      expect(helpText).toContain("-h, --help");
      expect(helpText).toContain("-v, --version");
      expect(helpText).toContain("-m, --mode <MODE>");
      expect(helpText).toContain("-t, --tree");
      expect(helpText).toContain("-c, --collapsible");
      expect(helpText).toContain("-s, --schema");
      expect(helpText).toContain("--settings");

      // Check for view modes descriptions
      expect(helpText).toContain("raw");
      expect(helpText).toContain("tree");
      expect(helpText).toContain("collapsible");
      expect(helpText).toContain("schema");
      expect(helpText).toContain("settings");

      // Check for examples
      expect(helpText).toContain('echo \'{"key": "value"}\' | jsont');
      expect(helpText).toContain("jsont data.json");
      expect(helpText).toContain("jsont --tree data.json");

      // Check for keyboard shortcuts
      expect(helpText).toContain("?");
      expect(helpText).toContain("q");
      expect(helpText).toContain("j/k, ↑/↓");

      consoleSpy.mockRestore();
    });
  });

  describe("showVersion", () => {
    it("should output version from package.json when available", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      // Mock successful fs read
      const mockRequire = vi.fn();
      mockRequire.mockImplementation((moduleName: string) => {
        if (moduleName === "node:fs") {
          return {
            readFileSync: vi.fn().mockReturnValue('{"version": "1.0.0"}'),
          };
        }
        if (moduleName === "node:path") {
          return {
            join: vi.fn().mockReturnValue("/mock/path/package.json"),
          };
        }
        return {};
      });

      // Mock global require
      vi.stubGlobal("require", mockRequire);

      showVersion();

      expect(consoleSpy).toHaveBeenCalledWith("jsont v1.0.0");

      consoleSpy.mockRestore();
      vi.unstubAllGlobals();
    });

    it("should output fallback version when package.json is not readable", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      // Mock failed fs read
      const mockRequire = vi.fn();
      mockRequire.mockImplementation((moduleName: string) => {
        if (moduleName === "node:fs") {
          return {
            readFileSync: vi.fn().mockImplementation(() => {
              throw new Error("File not found");
            }),
          };
        }
        if (moduleName === "node:path") {
          return {
            join: vi.fn().mockReturnValue("/mock/path/package.json"),
          };
        }
        return {};
      });

      // Mock global require
      vi.stubGlobal("require", mockRequire);

      showVersion();

      expect(consoleSpy).toHaveBeenCalledWith("jsont v1.0.0");

      consoleSpy.mockRestore();
      vi.unstubAllGlobals();
    });

    it("should output fallback version when JSON parsing fails", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      // Mock fs read with invalid JSON
      const mockRequire = vi.fn();
      mockRequire.mockImplementation((moduleName: string) => {
        if (moduleName === "node:fs") {
          return {
            readFileSync: vi.fn().mockReturnValue("invalid json"),
          };
        }
        if (moduleName === "node:path") {
          return {
            join: vi.fn().mockReturnValue("/mock/path/package.json"),
          };
        }
        return {};
      });

      // Mock global require
      vi.stubGlobal("require", mockRequire);

      showVersion();

      expect(consoleSpy).toHaveBeenCalledWith("jsont v1.0.0");

      consoleSpy.mockRestore();
      vi.unstubAllGlobals();
    });
  });
});
