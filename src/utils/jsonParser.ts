export function parseJsonSafely(input: string): {
  data: any;
  error: string | null;
} {
  try {
    const data = JSON.parse(input);
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function formatJsonValue(value: any): string {
  if (value === null) return "null";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value.toString();
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === "object") return `{${Object.keys(value).length} keys}`;
  return String(value);
}
