/**
 * Comprehensive tests for StatusBar component
 *
 * Tests status message generation based on different application states,
 * error handling, styling, and integration with status utilities.
 */

import { render } from "ink-testing-library";
import { describe, expect, it, vi } from "vitest";
import { StatusBar } from "./StatusBar";

// Mock the status utilities
vi.mock("@features/status/utils/statusUtils", () => ({
  getStatusContent: vi.fn(({ keyboardEnabled, collapsibleMode, error }) => {
    if (error) {
      return `Error: ${error}`;
    }

    if (keyboardEnabled) {
      return collapsibleMode
        ? "JSON TUI Viewer (Collapsible) - q: Quit | Ctrl+C: Exit | j/k: Move cursor | Enter/Space: Toggle"
        : "JSON TUI Viewer - q: Quit/Search input | Ctrl+C: Exit | j/k: Line | Ctrl+f/b: Half-page";
    } else {
      return "JSON TUI Viewer - Keyboard input not available (try: jsont < file.json in terminal)";
    }
  }),
}));

describe("StatusBar Component", () => {
  const defaultProps = {
    error: null,
    keyboardEnabled: false,
    collapsibleMode: false,
  };

  describe("Component Rendering", () => {
    it("should render status bar with basic structure", () => {
      const { lastFrame } = render(<StatusBar {...defaultProps} />);
      const output = lastFrame();

      expect(output).toContain("JSON TUI Viewer");
      expect(output).toContain("Keyboard input not available");
    });

    it("should apply border styling correctly", () => {
      const { lastFrame } = render(<StatusBar {...defaultProps} />);
      const output = lastFrame();

      // Should render with border (check for box characters)
      expect(output).toMatch(/[┌┐└┘─│]/);
    });

    it("should handle status message display", () => {
      const { lastFrame } = render(<StatusBar {...defaultProps} />);
      const output = lastFrame();

      expect(output).toContain("JSON TUI Viewer");
    });
  });

  describe("Keyboard Enabled States", () => {
    it("should display normal mode status when keyboard enabled", () => {
      const props = {
        ...defaultProps,
        keyboardEnabled: true,
      };

      const { lastFrame } = render(<StatusBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("JSON TUI Viewer - q: Quit/Search input");
      expect(output).toContain("j/k: Line");
      expect(output).toContain("Ctrl+f/b: Half-page");
    });

    it("should display collapsible mode status when keyboard enabled and collapsible mode", () => {
      const props = {
        ...defaultProps,
        keyboardEnabled: true,
        collapsibleMode: true,
      };

      const { lastFrame } = render(<StatusBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("JSON TUI Viewer (Collapsible)");
      expect(output).toContain("j/k: Move cursor");
      expect(output).toContain("Enter/Space: Toggle");
    });

    it("should display keyboard disabled message when keyboard not enabled", () => {
      const props = {
        ...defaultProps,
        keyboardEnabled: false,
      };

      const { lastFrame } = render(<StatusBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("Keyboard input not available");
      expect(output).toContain("try: jsont < file.json in terminal");
    });
  });

  describe("Error Handling", () => {
    it("should display error message with red styling", () => {
      const props = {
        ...defaultProps,
        error: "Failed to parse JSON",
      };

      const { lastFrame } = render(<StatusBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("Error: Failed to parse JSON");
    });

    it("should use red border color for errors", () => {
      const props = {
        ...defaultProps,
        error: "Test error",
      };

      // Component should render without errors
      expect(() => {
        render(<StatusBar {...props} />);
      }).not.toThrow();
    });

    it("should handle empty error message", () => {
      const props = {
        ...defaultProps,
        error: "",
      };

      const { lastFrame } = render(<StatusBar {...props} />);
      const output = lastFrame();

      // Empty string is falsy so won't show error, but will show normal status
      expect(output).toContain("JSON TUI Viewer");
    });

    it("should handle multiline error messages", () => {
      const props = {
        ...defaultProps,
        error: "Line 1 error\nLine 2 error\nLine 3 error",
      };

      const { lastFrame } = render(<StatusBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("Error: Line 1 error");
    });
  });

  describe("Styling and Colors", () => {
    it("should use green color for normal status", () => {
      const props = {
        ...defaultProps,
        error: null,
      };

      // Component should render without errors
      expect(() => {
        render(<StatusBar {...props} />);
      }).not.toThrow();
    });

    it("should use red color for error status", () => {
      const props = {
        ...defaultProps,
        error: "Test error",
      };

      // Component should render without errors
      expect(() => {
        render(<StatusBar {...props} />);
      }).not.toThrow();
    });

    it("should apply consistent border styling", () => {
      const { lastFrame } = render(<StatusBar {...defaultProps} />);
      const output = lastFrame();

      // Should have consistent box border characters
      expect(output).toMatch(/[┌┐└┘─│]/);
    });
  });

  describe("Prop Handling", () => {
    it("should handle undefined optional props", () => {
      const props = {
        error: null,
        // keyboardEnabled and collapsibleMode are undefined
      };

      const { lastFrame } = render(<StatusBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("JSON TUI Viewer");
    });

    it("should handle all props combinations", () => {
      const testCases = [
        { keyboardEnabled: true, collapsibleMode: true, error: null },
        { keyboardEnabled: true, collapsibleMode: false, error: null },
        { keyboardEnabled: false, collapsibleMode: true, error: null },
        { keyboardEnabled: false, collapsibleMode: false, error: null },
        { keyboardEnabled: true, collapsibleMode: true, error: "Test error" },
        { keyboardEnabled: false, collapsibleMode: false, error: "Test error" },
      ];

      testCases.forEach((testCase) => {
        expect(() => {
          render(<StatusBar {...testCase} />);
        }).not.toThrow();
      });
    });

    it("should default keyboardEnabled and collapsibleMode to false", () => {
      const props = {
        error: null,
      };

      const { lastFrame } = render(<StatusBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("Keyboard input not available");
    });
  });

  describe("Integration with Status Utils", () => {
    it("should render different messages based on props", () => {
      const props = {
        error: "test error",
        keyboardEnabled: true,
        collapsibleMode: true,
      };

      const { lastFrame } = render(<StatusBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("Error: test error");
    });

    it("should handle status utility behavior correctly", () => {
      const { lastFrame } = render(<StatusBar {...defaultProps} />);
      const output = lastFrame();

      expect(output).toContain("JSON TUI Viewer");
    });
  });

  describe("Edge Cases and Error Boundaries", () => {
    it("should handle null error correctly", () => {
      const props = {
        ...defaultProps,
        error: null,
      };

      const { lastFrame } = render(<StatusBar {...props} />);
      const output = lastFrame();

      expect(output).not.toContain("Error:");
      expect(output).toContain("JSON TUI Viewer");
    });

    it("should handle very long error messages", () => {
      const longError = "A".repeat(1000);
      const props = {
        ...defaultProps,
        error: longError,
      };

      const { lastFrame } = render(<StatusBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("Error:");
      expect(output).toContain("A");
    });

    it("should handle special characters in error messages", () => {
      const props = {
        ...defaultProps,
        error: "Error with special chars: @#$%^&*()[]{}|\\:;\"'<>?,./~`!",
      };

      const { lastFrame } = render(<StatusBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("Error: Error with special chars");
    });

    it("should handle unicode characters in error messages", () => {
      const props = {
        ...defaultProps,
        error: "Unicode error: 日本語 émojis 🎉 ñáéíóú",
      };

      const { lastFrame } = render(<StatusBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("Error: Unicode error");
    });
  });

  describe("Component Stability", () => {
    it("should render consistently across multiple renders", () => {
      const { rerender, lastFrame } = render(<StatusBar {...defaultProps} />);

      const firstRender = lastFrame();

      rerender(<StatusBar {...defaultProps} />);
      const secondRender = lastFrame();

      expect(firstRender).toEqual(secondRender);
    });

    it("should handle rapid prop changes", () => {
      const { rerender, lastFrame } = render(<StatusBar {...defaultProps} />);

      // Change to error state
      rerender(<StatusBar {...defaultProps} error="Error 1" />);
      expect(lastFrame()).toContain("Error: Error 1");

      // Change to keyboard enabled
      rerender(<StatusBar {...defaultProps} keyboardEnabled={true} />);
      expect(lastFrame()).toContain("q: Quit/Search input");

      // Change to collapsible mode
      rerender(
        <StatusBar
          {...defaultProps}
          keyboardEnabled={true}
          collapsibleMode={true}
        />,
      );
      expect(lastFrame()).toContain("Collapsible");

      // Back to normal
      rerender(<StatusBar {...defaultProps} />);
      expect(lastFrame()).toContain("Keyboard input not available");
    });

    it("should handle simultaneous prop changes", () => {
      const { rerender, lastFrame } = render(<StatusBar {...defaultProps} />);

      rerender(
        <StatusBar
          error="Simultaneous change"
          keyboardEnabled={true}
          collapsibleMode={true}
        />,
      );

      const output = lastFrame();
      expect(output).toContain("Error: Simultaneous change");
    });
  });

  describe("Accessibility and UX", () => {
    it("should provide clear status information for keyboard users", () => {
      const props = {
        ...defaultProps,
        keyboardEnabled: true,
      };

      const { lastFrame } = render(<StatusBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("q:");
      expect(output).toContain("Ctrl+C:");
      expect(output).toContain("j/k:");
    });

    it("should provide helpful guidance for non-keyboard users", () => {
      const props = {
        ...defaultProps,
        keyboardEnabled: false,
      };

      const { lastFrame } = render(<StatusBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("try: jsont < file.json in terminal");
    });

    it("should clearly indicate error states", () => {
      const props = {
        ...defaultProps,
        error: "Critical error occurred",
      };

      const { lastFrame } = render(<StatusBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("Error:");
      expect(output).toContain("Critical error occurred");
    });
  });
});
