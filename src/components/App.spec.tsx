import { render } from "ink-testing-library";
import { describe, expect, it, vi } from "vitest";
import { App } from "../App.js";

// Mock the useInput hook to simulate keyboard input
vi.mock("ink", async () => {
  const actual = await vi.importActual("ink");
  return {
    ...actual,
    useInput: vi.fn(),
    useApp: () => ({ exit: vi.fn() }),
  };
});

describe("App", () => {
  it("should render without error", () => {
    const data = { key: "value" };
    const { lastFrame } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    const output = lastFrame();
    expect(output).toContain("JSON TUI Viewer");
    expect(output).toContain("key");
    expect(output).toContain("value");
  });

  it("should display error message when provided", () => {
    const { lastFrame } = render(
      <App
        initialData={null}
        initialError="Test error"
        keyboardEnabled={false}
      />,
    );

    const output = lastFrame();
    expect(output).toContain("Error: Test error");
  });

  it("should show navigation help when keyboard is enabled", () => {
    const data = { test: "data" };
    const { lastFrame } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    const output = lastFrame();
    expect(output).toContain("j/k: Line");
    expect(output).toContain("Ctrl+f/b: Half-page");
    expect(output).toContain("s: Search");
  });

  it("should show initializing message when keyboard is disabled", () => {
    const data = { test: "data" };
    const { lastFrame } = render(
      <App initialData={data} keyboardEnabled={false} />,
    );

    const output = lastFrame();
    expect(output).toContain("Keyboard input not available");
  });

  it("should handle null data gracefully", () => {
    const { lastFrame } = render(
      <App initialData={null} keyboardEnabled={true} />,
    );

    const output = lastFrame();
    expect(output).toContain("No JSON data to display");
  });
});
