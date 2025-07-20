/**
 * Configuration context tests
 */

import { Text } from "ink";
import { render } from "ink-testing-library";
import { describe, expect, it, vi } from "vitest";
import type { JsontConfig } from "../../config/index.js";
import { ConfigProvider, useConfig, useConfigValue } from "../ConfigContext.js";

// Mock the config loader
vi.mock("../../config/loader.js", () => ({
  loadConfig: vi.fn(() => ({
    display: {
      json: {
        indent: 2,
        useTabs: false,
        maxLineLength: 80,
      },
      tree: {
        showArrayIndices: true,
        showPrimitiveValues: true,
        maxValueLength: 50,
        useUnicodeTree: true,
        showSchemaTypes: false,
      },
      interface: {
        showLineNumbers: false,
        debugMode: false,
        defaultHeight: 24,
        showStatusBar: true,
      },
    },
    keybindings: {
      navigation: {
        up: ["k", "ArrowUp"],
        down: ["j", "ArrowDown"],
        pageUp: ["Ctrl+b", "PageUp"],
        pageDown: ["Ctrl+f", "PageDown"],
        top: ["g"],
        bottom: ["G"],
      },
      modes: {
        search: ["s"],
        schema: ["S"],
        tree: ["T"],
        collapsible: ["C"],
        jq: ["J"],
        lineNumbers: ["L"],
        debug: ["D"],
        help: ["?"],
        export: ["E"],
        quit: ["q"],
      },
      search: {
        next: ["n"],
        previous: ["N"],
        exit: ["Escape"],
      },
    },
    behavior: {
      search: {
        caseSensitive: false,
        regex: false,
        highlight: true,
      },
      navigation: {
        halfPageScroll: true,
        autoScroll: true,
        scrollOffset: 2,
      },
    },
  })),
}));

// Test components
function TestConfigDisplay() {
  const config = useConfig();
  return <Text>{JSON.stringify({ indent: config.display.json.indent })}</Text>;
}

function TestConfigValueDisplay() {
  const indent = useConfigValue<number>("display.json.indent");
  const useTabs = useConfigValue<boolean>("display.json.useTabs");
  return <Text>{JSON.stringify({ indent, useTabs })}</Text>;
}

function TestConfigWithoutProvider() {
  const config = useConfig();
  return <Text>{config.display.json.indent}</Text>;
}

describe("ConfigContext", () => {
  describe("ConfigProvider", () => {
    it("should provide config from loader when no config prop is given", () => {
      const { lastFrame } = render(
        <ConfigProvider>
          <TestConfigDisplay />
        </ConfigProvider>,
      );

      expect(lastFrame()).toContain('{"indent":2}');
    });

    it("should provide custom config when config prop is given", () => {
      const customConfig: JsontConfig = {
        display: {
          json: {
            indent: 8,
            useTabs: true,
            maxLineLength: 120,
          },
          tree: {
            showArrayIndices: false,
            showPrimitiveValues: false,
            maxValueLength: 30,
            useUnicodeTree: false,
            showSchemaTypes: true,
          },
          interface: {
            showLineNumbers: true,
            debugMode: true,
            defaultHeight: 30,
            showStatusBar: false,
          },
        },
        keybindings: {
          navigation: {
            up: ["w"],
            down: ["s"],
            pageUp: ["Ctrl+u"],
            pageDown: ["Ctrl+d"],
            top: ["gg"],
            bottom: ["GG"],
          },
          modes: {
            search: ["/"],
            schema: ["S"],
            tree: ["T"],
            collapsible: ["C"],
            jq: ["J"],
            lineNumbers: ["L"],
            debug: ["D"],
            help: ["?"],
            export: ["E"],
            quit: ["q"],
          },
          search: {
            next: ["n"],
            previous: ["N"],
            exit: ["Escape"],
          },
        },
        behavior: {
          search: {
            caseSensitive: true,
            regex: true,
            highlight: false,
          },
          navigation: {
            halfPageScroll: false,
            autoScroll: false,
            scrollOffset: 5,
          },
        },
      };

      const { lastFrame } = render(
        <ConfigProvider config={customConfig}>
          <TestConfigDisplay />
        </ConfigProvider>,
      );

      expect(lastFrame()).toContain('{"indent":8}');
    });
  });

  describe("useConfig", () => {
    it("should throw error when used outside ConfigProvider", () => {
      // Capture console errors since React may log errors differently in test mode
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestConfigWithoutProvider />);
      }).toThrow("useConfig must be used within a ConfigProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("useConfigValue", () => {
    it("should return specific config values by path", () => {
      const { lastFrame } = render(
        <ConfigProvider>
          <TestConfigValueDisplay />
        </ConfigProvider>,
      );

      expect(lastFrame()).toContain('{"indent":2,"useTabs":false}');
    });

    it("should throw error for invalid config path", () => {
      function TestInvalidPath() {
        const value = useConfigValue("invalid.path.that.does.not.exist");
        return <Text>{String(value)}</Text>;
      }

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(
          <ConfigProvider>
            <TestInvalidPath />
          </ConfigProvider>,
        );
      }).toThrow(
        'Configuration path "invalid.path.that.does.not.exist" not found',
      );

      consoleSpy.mockRestore();
    });

    it("should handle nested path access", () => {
      function TestNestedPath() {
        const keybindings = useConfigValue("keybindings.navigation.up");
        return <Text>{JSON.stringify(keybindings)}</Text>;
      }

      const { lastFrame } = render(
        <ConfigProvider>
          <TestNestedPath />
        </ConfigProvider>,
      );

      expect(lastFrame()).toContain('["k","ArrowUp"]');
    });

    it("should throw error when used outside ConfigProvider", () => {
      function TestConfigValueWithoutProvider() {
        const indent = useConfigValue<number>("display.json.indent");
        return <Text>{indent}</Text>;
      }

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestConfigValueWithoutProvider />);
      }).toThrow("useConfig must be used within a ConfigProvider");

      consoleSpy.mockRestore();
    });
  });
});
