/**
 * wcagUtils.ts
 * WCAG threshold lookups, level metadata, and pass/fail helpers.
 */

export interface WcagCriterion {
  id: string;
  level: "A" | "AA" | "AAA";
  title: string;
  url: string;
}

const WCAG_CRITERIA: Record<string, WcagCriterion> = {
  "1.3.1": { id: "1.3.1", level: "A",   title: "Info and Relationships",       url: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships" },
  "1.3.2": { id: "1.3.2", level: "A",   title: "Meaningful Sequence",          url: "https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence" },
  "1.4.3": { id: "1.4.3", level: "AA",  title: "Contrast (Minimum)",           url: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum" },
  "1.4.4": { id: "1.4.4", level: "AA",  title: "Resize Text",                  url: "https://www.w3.org/WAI/WCAG22/Understanding/resize-text" },
  "1.4.10": { id: "1.4.10", level: "AA", title: "Reflow",                      url: "https://www.w3.org/WAI/WCAG22/Understanding/reflow" },
  "1.4.11": { id: "1.4.11", level: "AA", title: "Non-text Contrast",           url: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast" },
  "1.4.12": { id: "1.4.12", level: "AA", title: "Text Spacing",                url: "https://www.w3.org/WAI/WCAG22/Understanding/text-spacing" },
  "2.4.3": { id: "2.4.3", level: "A",   title: "Focus Order",                  url: "https://www.w3.org/WAI/WCAG22/Understanding/focus-order" },
  "2.4.7": { id: "2.4.7", level: "AA",  title: "Focus Visible",                url: "https://www.w3.org/WAI/WCAG22/Understanding/focus-visible" },
  "2.5.8": { id: "2.5.8", level: "AA",  title: "Target Size (Minimum)",        url: "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum" },
  "4.1.2": { id: "4.1.2", level: "A",   title: "Name, Role, Value",            url: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value" },
};

export function getWcagCriterion(id: string): WcagCriterion | undefined {
  return WCAG_CRITERIA[id];
}

/** Minimum contrast ratios by WCAG level and text size. */
export const CONTRAST_THRESHOLDS = {
  AA:  { normal: 4.5, large: 3.0 },
  AAA: { normal: 7.0, large: 4.5 },
  nonText: 3.0,
} as const;

/** Minimum tap target size in px per WCAG 2.5.8. */
export const MIN_TARGET_SIZE_PX = 24;

/** Minimum spacing between interactive elements in px. */
export const MIN_TOUCH_SPACING_PX = 8;

/** Line-height multiplier lower bound per WCAG 1.4.12. */
export const MIN_LINE_HEIGHT_MULTIPLIER = 1.5;

/** Letter-spacing multiplier lower bound per WCAG 1.4.12. */
export const MIN_LETTER_SPACING_MULTIPLIER = 0.12;

/** Valid semantic landmark names (case-insensitive prefix match). */
export const LANDMARK_NAMES = ["header", "nav", "main", "footer", "sidebar", "search", "aside", "section", "article", "form"];

/** Generic layer name patterns that suggest missing accessible names. */
export const GENERIC_NAME_PATTERNS = [
  /^(frame|group|rectangle|ellipse|polygon|star|line|vector|boolean|component|instance)\s*\d*$/i,
  /^\d+$/,
  /^layer\s*\d*$/i,
];

export function isGenericName(name: string): boolean {
  return GENERIC_NAME_PATTERNS.some((re) => re.test(name.trim()));
}
