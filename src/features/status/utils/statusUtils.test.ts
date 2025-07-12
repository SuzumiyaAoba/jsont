import { describe, expect, it } from "vitest";
import { calculateStatusBarHeight, getStatusContent } from "./statusUtils.js";

describe("statusUtils", () => {
  describe("getStatusContent", () => {
    it("should return error message when error is provided", () => {
      const result = getStatusContent({
        keyboardEnabled: true,
        collapsibleMode: false,
        error: "Test error",
      });

      expect(result).toBe("Error: Test error");
    });

    it("should return collapsible mode message when keyboard enabled and collapsible mode is true", () => {
      const result = getStatusContent({
        keyboardEnabled: true,
        collapsibleMode: true,
      });

      expect(result).toContain("JSON TUI Viewer (Collapsible)");
      expect(result).toContain("j/k: Move cursor");
      expect(result).toContain("Enter: Toggle expand/collapse");
    });

    it("should return normal mode message when keyboard enabled and collapsible mode is false", () => {
      const result = getStatusContent({
        keyboardEnabled: true,
        collapsibleMode: false,
      });

      expect(result).toContain("JSON TUI Viewer");
      expect(result).not.toContain("(Collapsible)");
      expect(result).toContain("j/k: Line");
      expect(result).toContain("gg/G: Top/Bottom");
    });

    it("should return keyboard unavailable message when keyboard is disabled", () => {
      const result = getStatusContent({
        keyboardEnabled: false,
        collapsibleMode: false,
      });

      expect(result).toContain("Keyboard input not available");
      expect(result).toContain("?: Toggle help");
    });
  });

  describe("calculateStatusBarHeight", () => {
    it("should calculate minimum height for short content", () => {
      const content = "Short message";
      const terminalWidth = 80;

      const height = calculateStatusBarHeight(content, terminalWidth);

      expect(height).toBe(5); // Minimum height
    });

    it("should calculate appropriate height for long content", () => {
      // Create a long message that would wrap
      const content =
        "This is a very long status message that should wrap across multiple lines when displayed in a terminal with limited width and should result in a height calculation greater than the minimum.";
      const terminalWidth = 40; // Narrow terminal

      const height = calculateStatusBarHeight(content, terminalWidth);

      expect(height).toBeGreaterThan(5);
    });

    it("should handle very narrow terminals gracefully", () => {
      const content = "Normal message";
      const terminalWidth = 10; // Very narrow

      const height = calculateStatusBarHeight(content, terminalWidth);

      expect(height).toBeGreaterThanOrEqual(5);
    });

    it("should calculate consistent height for typical terminal width", () => {
      const content = getStatusContent({
        keyboardEnabled: true,
        collapsibleMode: false,
      });
      const terminalWidth = 80; // Standard terminal width

      const height = calculateStatusBarHeight(content, terminalWidth);

      // For typical content and 80-char terminal, should be reasonable
      expect(height).toBeGreaterThanOrEqual(5);
      expect(height).toBeLessThanOrEqual(10);
    });
  });
});
