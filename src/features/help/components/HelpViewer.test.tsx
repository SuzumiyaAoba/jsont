/**
 * Tests for the enhanced HelpViewer component
 */

import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import { HelpViewer } from "./HelpViewer";

describe("HelpViewer", () => {
  it("should render help content for tree mode", () => {
    const { lastFrame } = render(
      <HelpViewer mode="tree" height={20} width={80} />,
    );

    const output = lastFrame();
    expect(output).toContain("HELP - TREE MODE");
    expect(output).toContain("k / ↑");
    expect(output).toContain("Move up");
    expect(output).toContain("Expand all nodes");
    expect(output).toContain("Toggle schema type display");
  });

  it("should render help content for search mode", () => {
    const { lastFrame } = render(
      <HelpViewer mode="search" height={20} width={80} />,
    );

    const output = lastFrame();
    expect(output).toContain("HELP - SEARCH MODE");
    expect(output).toContain("Exit search mode");
    expect(output).toContain("Go to next result");
    expect(output).toContain("Return to search input");
  });

  it("should render help content for filter mode", () => {
    const { lastFrame } = render(
      <HelpViewer mode="filter" height={20} width={80} />,
    );

    const output = lastFrame();
    expect(output).toContain("HELP - FILTER MODE");
    expect(output).toContain("Exit jq mode");
    expect(output).toContain("Switch between input/output");
  });

  it("should render help content for schema mode", () => {
    const { lastFrame } = render(
      <HelpViewer mode="schema" height={20} width={80} />,
    );

    const output = lastFrame();
    expect(output).toContain("HELP - SCHEMA MODE");
    expect(output).toContain("Scroll down");
    expect(output).toContain("Export schema");
  });

  it("should render help content for collapsible mode", () => {
    const { lastFrame } = render(
      <HelpViewer mode="collapsible" height={20} width={80} />,
    );

    const output = lastFrame();
    expect(output).toContain("HELP - COLLAPSIBLE MODE");
    expect(output).toContain("Move cursor down");
    expect(output).toContain("Toggle node");
  });

  it("should render help content for raw mode", () => {
    const { lastFrame } = render(
      <HelpViewer mode="raw" height={20} width={80} />,
    );

    const output = lastFrame();
    expect(output).toContain("HELP - RAW MODE");
    expect(output).toContain("Scroll down");
    expect(output).toContain("Page down");
  });

  it("should include help header in all modes", () => {
    const modes = [
      "tree",
      "search",
      "filter",
      "collapsible",
      "schema",
      "raw",
    ] as const;

    for (const mode of modes) {
      const { lastFrame } = render(
        <HelpViewer mode={mode} height={20} width={80} />,
      );

      const output = lastFrame();
      expect(output).toContain(`HELP - ${mode.toUpperCase()} MODE`);
      expect(output).toContain("Press ? again or Esc to close help");
    }
  });
});
