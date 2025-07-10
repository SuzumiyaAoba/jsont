import { render } from "ink-testing-library";
import { describe, expect, it, vi } from "vitest";
import { App } from "../App";

// Mock the useInput hook to simulate keyboard input
let mockInputHandler: ((input: string, key: any) => void) | null = null;

vi.mock("ink", async () => {
  const actual = await vi.importActual("ink");
  return {
    ...actual,
    useInput: vi.fn((handler: (input: string, key: any) => void) => {
      mockInputHandler = handler;
    }),
    useApp: () => ({ exit: vi.fn() }),
  };
});

describe("Debug Toggle Functionality", () => {
  it("should not show debug bar by default", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    const output = lastFrame();
    expect(output).not.toContain("DEBUG:");
  });

  it("should show debug bar when D key is pressed", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Initially no debug bar
    let output = lastFrame();
    expect(output).not.toContain("DEBUG:");

    // Press D to toggle debug mode
    mockInputHandler?.("D", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Should now show debug bar
    output = lastFrame();
    expect(output).toContain("DEBUG:");
    expect(output).toContain("Keyboard: ON");
  });

  it("should hide debug bar when D key is pressed again", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Press D to show debug mode
    mockInputHandler?.("D", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Should show debug bar
    let output = lastFrame();
    expect(output).toContain("DEBUG:");

    // Press D again to hide debug mode
    mockInputHandler?.("D", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Should hide debug bar
    output = lastFrame();
    expect(output).not.toContain("DEBUG:");
  });

  it("should show toggle debug help in status bar", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    const output = lastFrame();
    expect(output).toContain("D: Toggle debug");
  });

  it("should not respond to lowercase d key", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Press lowercase d (should not toggle debug)
    mockInputHandler?.("d", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Should still not show debug bar
    const output = lastFrame();
    expect(output).not.toContain("DEBUG:");
  });
});
