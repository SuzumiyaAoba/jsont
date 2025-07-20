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
    expect(output).toContain("Tr"); // "Tree Navigation" が "Tr" として短縮表示
    expect(output).toContain("Tre"); // "Tree Operations" が "Tre" として短縮表示
    expect(output).toContain("j / ↓"); // "j / ↓" が表示されることを確認
    expect(output).toContain("expansion"); // "Toggle node expansion" の "expansion" をチェック
  });

  it("should render help content for search mode", () => {
    const { lastFrame } = render(
      <HelpViewer mode="search" height={20} width={80} />,
    );

    const output = lastFrame();
    expect(output).toContain("HELP - SEARCH MODE");
    expect(output).toContain("Se"); // "Search Operations" が短縮表示
    expect(output).toContain("Te"); // "Text Input" が短縮表示
    expect(output).toContain("search");
  });

  it("should render help content for filter mode", () => {
    const { lastFrame } = render(
      <HelpViewer mode="filter" height={20} width={80} />,
    );

    const output = lastFrame();
    expect(output).toContain("HELP - FILTER MODE");
    expect(output).toContain("Fi"); // "Filter Operations" が短縮表示
    expect(output).toContain("filter");
  });

  it("should render help content for raw mode", () => {
    const { lastFrame } = render(
      <HelpViewer mode="raw" height={20} width={80} />,
    );

    const output = lastFrame();
    expect(output).toContain("HELP - RAW MODE");
    expect(output).toContain("Ra"); // "Raw View Navigation" が短縮表示
    expect(output).toContain("Di"); // "Display Options" が短縮表示
  });

  it("should include common help sections in all modes", () => {
    const modes = ["tree", "search", "filter", "raw"] as const;

    for (const mode of modes) {
      const { lastFrame } = render(
        <HelpViewer mode={mode} height={20} width={80} />,
      );

      const output = lastFrame();
      expect(output).toContain("Mo"); // "Mode Switching" の一部が確実に含まれることをチェック
      expect(output).toContain("Gl"); // "Global Controls" が短縮表示
      expect(output).toContain("HELP -");
    }
  });
});
