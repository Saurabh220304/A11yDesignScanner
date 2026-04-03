/**
 * colorUtils.ts
 * WCAG 2.2 colour-contrast utilities — relative luminance & contrast ratio.
 */

/** Parse 3- or 6-digit hex string → {r,g,b} (0-255). */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace(/^#/, "");
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return null;
}

/** Convert a 0-255 channel value to its linearised sRGB component. */
function linearise(channel255: number): number {
  const c = channel255 / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance for an RGB triple (0-255 each). */
export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/** WCAG contrast ratio between two luminance values. */
export function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Determine whether a contrast ratio passes WCAG AA or AAA. */
export function meetsContrastRequirement(
  ratio: number,
  isLargeText: boolean,
  level: "AA" | "AAA"
): boolean {
  if (level === "AA") return ratio >= (isLargeText ? 3.0 : 4.5);
  return ratio >= (isLargeText ? 4.5 : 7.0);
}

/**
 * Convert a Figma RGBA paint colour to relative luminance.
 * Returns null if the paint is not a solid colour.
 */
export function figmaPaintToLuminance(paint: Paint): number | null {
  if (paint.type !== "SOLID") return null;
  const { r, g, b } = paint.color;
  return relativeLuminance(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

/** Determine whether text is "large" under WCAG (≥18pt, or ≥14pt bold). */
export function isLargeText(node: TextNode): boolean {
  const size = node.fontSize as number;
  const weight = (node.fontWeight as number) ?? 400;
  return size >= 18 || (size >= 14 && weight >= 700);
}

/** Convert Figma RGBA to a CSS hex string. */
export function figmaRgbToHex({ r, g, b }: RGB): string {
  const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
