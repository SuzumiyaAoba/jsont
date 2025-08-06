/**
 * Platform-specific styling abstraction for components
 * Provides unified styling interfaces that work across terminal and web platforms
 */

import type { RenderStyle } from "@core/rendering";

/**
 * Component size types
 */
export type ComponentSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Component variant types
 */
export type ComponentVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info";

/**
 * Component theme configuration
 */
export interface ComponentTheme {
  /**
   * Color palette
   */
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
    accent: string;
  };

  /**
   * Typography settings
   */
  typography: {
    fontFamily: string;
    fontSize: {
      xs: number | string;
      sm: number | string;
      md: number | string;
      lg: number | string;
      xl: number | string;
    };
    lineHeight: number;
  };

  /**
   * Spacing scale
   */
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };

  /**
   * Border radius scale
   */
  borderRadius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    full: number;
  };

  /**
   * Animation settings
   */
  animation: {
    duration: {
      fast: number;
      normal: number;
      slow: number;
    };
    easing: string;
  };
}

/**
 * Component style configuration
 */
export interface ComponentStyleConfig {
  /**
   * Base styles applied to all components
   */
  base?: RenderStyle;

  /**
   * Size-specific styles
   */
  sizes?: Partial<Record<ComponentSize, RenderStyle>>;

  /**
   * Variant-specific styles
   */
  variants?: Partial<Record<ComponentVariant, RenderStyle>>;

  /**
   * State-specific styles
   */
  states?: {
    hover?: RenderStyle;
    focus?: RenderStyle;
    active?: RenderStyle;
    disabled?: RenderStyle;
    loading?: RenderStyle;
  };

  /**
   * Platform-specific overrides
   */
  platform?: {
    terminal?: RenderStyle;
    web?: RenderStyle;
  };
}

/**
 * Computed component styles
 */
export interface ComputedComponentStyle {
  /**
   * Final computed style
   */
  style: RenderStyle;

  /**
   * CSS class names (web only)
   */
  className?: string;

  /**
   * Data attributes
   */
  dataAttributes?: Record<string, string>;
}

/**
 * Style computation context
 */
export interface StyleContext {
  /**
   * Current theme
   */
  theme: ComponentTheme;

  /**
   * Platform type
   */
  platform: "terminal" | "web";

  /**
   * Component properties
   */
  props: {
    size?: ComponentSize;
    variant?: ComponentVariant;
    disabled?: boolean;
    focused?: boolean;
    loading?: boolean;
    // biome-ignore lint/suspicious/noExplicitAny: Flexible component state properties
    [key: string]: any;
  };

  /**
   * Component state
   */
  state: {
    hover: boolean;
    focus: boolean;
    active: boolean;
    // biome-ignore lint/suspicious/noExplicitAny: Flexible style context properties
    [key: string]: any;
  };
}

/**
 * Default theme configuration
 */
export const DEFAULT_THEME: ComponentTheme = {
  colors: {
    primary: "#007acc",
    secondary: "#6c757d",
    success: "#28a745",
    warning: "#ffc107",
    error: "#dc3545",
    info: "#17a2b8",
    background: "#ffffff",
    foreground: "#212529",
    muted: "#6c757d",
    border: "#dee2e6",
    accent: "#007acc",
  },
  typography: {
    fontFamily:
      "'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', 'Courier New', monospace",
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
    },
    lineHeight: 1.4,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    none: 0,
    sm: 2,
    md: 4,
    lg: 8,
    full: 9999,
  },
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: "ease-in-out",
  },
};

/**
 * Dark theme configuration
 */
export const DARK_THEME: ComponentTheme = {
  ...DEFAULT_THEME,
  colors: {
    primary: "#4fc3f7",
    secondary: "#90a4ae",
    success: "#66bb6a",
    warning: "#ffb74d",
    error: "#f44336",
    info: "#29b6f6",
    background: "#1e1e1e",
    foreground: "#ffffff",
    muted: "#90a4ae",
    border: "#333333",
    accent: "#4fc3f7",
  },
};

/**
 * Terminal-specific theme adjustments
 */
export const TERMINAL_THEME_ADJUSTMENTS: Partial<ComponentTheme> = {
  colors: {
    primary: "blue",
    secondary: "gray",
    success: "green",
    warning: "yellow",
    error: "red",
    info: "cyan",
    background: "black",
    foreground: "white",
    muted: "gray",
    border: "gray",
    accent: "blue",
  },
  typography: {
    fontFamily: "monospace",
    fontSize: {
      xs: 1,
      sm: 1,
      md: 1,
      lg: 1,
      xl: 1,
    },
    lineHeight: 1,
  },
  spacing: {
    xs: 1,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
  },
  borderRadius: {
    none: 0,
    sm: 0,
    md: 0,
    lg: 0,
    full: 0,
  },
};

/**
 * Component styling utility class
 */
export class ComponentStyling {
  private theme: ComponentTheme;
  private platform: "terminal" | "web";

  constructor(
    theme: ComponentTheme = DEFAULT_THEME,
    platform: "terminal" | "web" = "terminal",
  ) {
    this.theme = this.adjustThemeForPlatform(theme, platform);
    this.platform = platform;
  }

  /**
   * Compute component styles
   */
  computeStyles(
    config: ComponentStyleConfig,
    context: Partial<StyleContext> = {},
  ): ComputedComponentStyle {
    const fullContext: StyleContext = {
      theme: this.theme,
      platform: this.platform,
      props: {},
      state: {
        hover: false,
        focus: false,
        active: false,
      },
      ...context,
    };

    let computedStyle: RenderStyle = {};

    // Apply base styles
    if (config.base) {
      computedStyle = this.mergeStyles(computedStyle, config.base);
    }

    // Apply size-specific styles
    if (fullContext.props.size && config.sizes?.[fullContext.props.size]) {
      const sizeStyle = config.sizes[fullContext.props.size];
      if (sizeStyle) {
        computedStyle = this.mergeStyles(computedStyle, sizeStyle);
      }
    }

    // Apply variant-specific styles
    if (
      fullContext.props.variant &&
      config.variants?.[fullContext.props.variant]
    ) {
      const variantStyle = config.variants[fullContext.props.variant];
      if (variantStyle) {
        computedStyle = this.mergeStyles(computedStyle, variantStyle);
      }
    }

    // Apply state-specific styles
    if (config.states) {
      if (fullContext.state.hover && config.states.hover) {
        computedStyle = this.mergeStyles(computedStyle, config.states.hover);
      }
      if (fullContext.state.focus && config.states.focus) {
        computedStyle = this.mergeStyles(computedStyle, config.states.focus);
      }
      if (fullContext.state.active && config.states.active) {
        computedStyle = this.mergeStyles(computedStyle, config.states.active);
      }
      if (fullContext.props.disabled && config.states.disabled) {
        computedStyle = this.mergeStyles(computedStyle, config.states.disabled);
      }
      if (fullContext.props.loading && config.states.loading) {
        computedStyle = this.mergeStyles(computedStyle, config.states.loading);
      }
    }

    // Apply platform-specific overrides
    if (config.platform) {
      const platformStyle = config.platform[this.platform];
      if (platformStyle) {
        computedStyle = this.mergeStyles(computedStyle, platformStyle);
      }
    }

    // Generate CSS class name for web
    const result: ComputedComponentStyle = {
      style: computedStyle,
      dataAttributes: this.generateDataAttributes(fullContext),
    };

    if (this.platform === "web") {
      result.className = this.generateClassName(fullContext);
    }

    return result;
  }

  /**
   * Get theme value by path
   */
  getThemeValue(path: string): unknown {
    const keys = path.split(".");
    let value: unknown = this.theme;

    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Create a responsive style based on size
   */
  createResponsiveStyle(
    property: keyof RenderStyle,
    values: Partial<Record<ComponentSize, unknown>>,
  ): ComponentStyleConfig {
    const sizes: Partial<Record<ComponentSize, RenderStyle>> = {};

    for (const [size, value] of Object.entries(values)) {
      sizes[size as ComponentSize] = { [property]: value };
    }

    return { sizes };
  }

  /**
   * Create theme-aware colors
   */
  createThemedColors(variant: ComponentVariant): {
    color: string;
    backgroundColor?: string;
    borderColor?: string;
  } {
    const color = this.theme.colors[variant];

    if (this.platform === "terminal") {
      return { color };
    }

    // Web platform - create complementary colors
    return {
      color: variant === "primary" ? this.theme.colors.background : color,
      backgroundColor: variant === "primary" ? color : "transparent",
      borderColor: color,
    };
  }

  /**
   * Create animation styles (web only)
   */
  createAnimationStyle(
    _property: string,
    _duration: keyof ComponentTheme["animation"]["duration"] = "normal",
  ): RenderStyle {
    if (this.platform === "terminal") {
      return {}; // No animations in terminal
    }

    // Web-specific transition properties (extend RenderStyle if needed)
    return {} as RenderStyle;
  }

  /**
   * Merge multiple styles
   */
  private mergeStyles(...styles: RenderStyle[]): RenderStyle {
    // Use Object.assign to avoid O(n²) complexity from spread in reduce
    return styles.reduce((merged, style) => {
      // biome-ignore lint/performance/noAccumulatingSpread: Object.assign is the recommended alternative to spread in reduce
      return Object.assign(merged, style);
    }, {} as RenderStyle);
  }

  /**
   * Adjust theme for platform
   */
  private adjustThemeForPlatform(
    theme: ComponentTheme,
    platform: "terminal" | "web",
  ): ComponentTheme {
    if (platform === "terminal") {
      return this.mergeThemes(theme, TERMINAL_THEME_ADJUSTMENTS);
    }
    return theme;
  }

  /**
   * Merge themes
   */
  private mergeThemes(
    base: ComponentTheme,
    override: Partial<ComponentTheme>,
  ): ComponentTheme {
    return {
      colors: { ...base.colors, ...override.colors },
      typography: {
        ...base.typography,
        ...override.typography,
        fontSize: {
          ...base.typography.fontSize,
          ...override.typography?.fontSize,
        },
      },
      spacing: { ...base.spacing, ...override.spacing },
      borderRadius: { ...base.borderRadius, ...override.borderRadius },
      animation: {
        ...base.animation,
        ...override.animation,
        duration: {
          ...base.animation.duration,
          ...override.animation?.duration,
        },
      },
    };
  }

  /**
   * Generate CSS class name for web
   */
  private generateClassName(context: StyleContext): string {
    const parts = ["jsont-component"];

    if (context.props.size) {
      parts.push(`size-${context.props.size}`);
    }

    if (context.props.variant) {
      parts.push(`variant-${context.props.variant}`);
    }

    if (context.props.disabled) {
      parts.push("disabled");
    }

    if (context.props.focused) {
      parts.push("focused");
    }

    if (context.props.loading) {
      parts.push("loading");
    }

    return parts.join(" ");
  }

  /**
   * Generate data attributes
   */
  private generateDataAttributes(
    context: StyleContext,
  ): Record<string, string> {
    const attributes: Record<string, string> = {};

    if (context.props.size) {
      attributes["data-size"] = context.props.size;
    }

    if (context.props.variant) {
      attributes["data-variant"] = context.props.variant;
    }

    attributes["data-platform"] = context.platform;

    return attributes;
  }
}

/**
 * Pre-defined component style configurations
 */
export const COMPONENT_STYLES = {
  /**
   * Button component styles
   */
  button: {
    base: {
      padding: 8,
      borderStyle: "solid" as const,
      borderWidth: 1,
      cursor: "pointer",
    } as RenderStyle,
    sizes: {
      xs: { padding: 4, fontSize: 12 },
      sm: { padding: 6, fontSize: 14 },
      md: { padding: 8, fontSize: 16 },
      lg: { padding: 12, fontSize: 18 },
      xl: { padding: 16, fontSize: 20 },
    } as Record<ComponentSize, RenderStyle>,
    variants: {
      primary: { backgroundColor: "#007acc", color: "white" },
      secondary: { backgroundColor: "transparent", color: "#6c757d" },
      success: { backgroundColor: "#28a745", color: "white" },
      warning: { backgroundColor: "#ffc107", color: "black" },
      error: { backgroundColor: "#dc3545", color: "white" },
      info: { backgroundColor: "#17a2b8", color: "white" },
    } as Record<ComponentVariant, RenderStyle>,
    states: {
      hover: { opacity: 0.8 },
      focus: { boxShadow: "0 0 0 2px rgba(0, 122, 204, 0.25)" },
      disabled: { opacity: 0.5, cursor: "not-allowed" },
    },
  } as ComponentStyleConfig,

  /**
   * Input component styles
   */
  input: {
    base: {
      padding: 8,
      borderStyle: "solid" as const,
      borderWidth: 1,
      borderColor: "#dee2e6",
      backgroundColor: "white",
    } as RenderStyle,
    states: {
      focus: {
        borderColor: "#007acc",
        boxShadow: "0 0 0 2px rgba(0, 122, 204, 0.25)",
      },
      disabled: { backgroundColor: "#f8f9fa", opacity: 0.6 },
    },
  } as ComponentStyleConfig,

  /**
   * Container component styles
   */
  container: {
    base: {
      display: "flex" as const,
      flexDirection: "column" as const,
    } as RenderStyle,
  } as ComponentStyleConfig,

  /**
   * Text component styles
   */
  text: {
    base: {
      fontFamily: "'JetBrains Mono', monospace",
    } as RenderStyle,
    variants: {
      primary: { color: "#007acc" },
      secondary: { color: "#6c757d" },
      success: { color: "#28a745" },
      warning: { color: "#ffc107" },
      error: { color: "#dc3545" },
      info: { color: "#17a2b8" },
    } as Record<ComponentVariant, RenderStyle>,
  } as ComponentStyleConfig,
};
