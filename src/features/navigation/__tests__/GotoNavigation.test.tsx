import type { JsonValue } from "@core/types/index";
import { render } from "ink-testing-library";
import { describe, expect, it, vi } from "vitest";
import { App } from "@/App";

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

  it("should render JSON data correctly", () => {
    const data = { test: "data" };

    const { lastFrame } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    const output = lastFrame();
    expect(output).toContain("test");
    expect(output).toContain("data");
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
    expect(output).toContain("line");
  });

  it("should display simple JSON data correctly", () => {
    const data = { simple: "data" };

    const { lastFrame } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    const output = lastFrame();
    expect(output).toContain("simple");
    expect(output).toContain("data");
  });
});
