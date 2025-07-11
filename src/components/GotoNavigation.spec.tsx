import { render } from "ink-testing-library";
import { describe, expect, it, vi } from "vitest";
import { App } from "../App";
import type { JsonValue } from "../types/index";

// Mock the useInput hook to simulate keyboard input
type MockKeyInput = {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  return?: boolean;
  escape?: boolean;
  backspace?: boolean;
  delete?: boolean;
};

let mockInputHandler: ((input: string, key: MockKeyInput) => void) | null =
  null;

vi.mock("ink", async () => {
  const actual = await vi.importActual("ink");
  return {
    ...actual,
    useInput: vi.fn((handler: (input: string, key: MockKeyInput) => void) => {
      mockInputHandler = handler;
    }),
    useApp: () => ({ exit: vi.fn() }),
  };
});

describe("Goto Navigation (gg/G)", () => {
  const createLargeJsonData = (): JsonValue => {
    const data: Record<string, string> = {};
    for (let i = 1; i <= 50; i++) {
      data[`line${i}`] = `value${i}`;
    }
    return data;
  };

  it("should render app with goto navigation enabled", () => {
    const data = createLargeJsonData();

    const { lastFrame } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    const output = lastFrame();
    expect(output).toBeDefined();
    expect(output).toContain("line1");
  });

  it("should show updated status bar with gg/G help", () => {
    const data = { test: "data" };

    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Press '?' to show help
    if (mockInputHandler) {
      mockInputHandler("?", {});
      rerender(<App initialData={data} keyboardEnabled={true} />);
    }

    const output = lastFrame();
    expect(output).toContain("gg/G:");
    expect(output).toContain("Top/Bottom");
  });

  it("should handle large JSON data without errors", () => {
    const data = createLargeJsonData();

    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={false} />,
    );

    // Press '?' to show help
    if (mockInputHandler) {
      mockInputHandler("?", {});
      rerender(<App initialData={data} keyboardEnabled={false} />);
    }

    const output = lastFrame();
    expect(output).toBeDefined();
    expect(output).toContain("JSON TUI Viewer");
  });

  it("should display navigation help correctly", () => {
    const data = { simple: "data" };

    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Press '?' to show help
    if (mockInputHandler) {
      mockInputHandler("?", {});
      rerender(<App initialData={data} keyboardEnabled={true} />);
    }

    const output = lastFrame();
    expect(output).toContain("j/k: Line");
    expect(output).toContain("Ctrl+f/b: Half-page");
    expect(output).toContain("gg/G:");
    expect(output).toContain("Top/Bottom");
  });
});
