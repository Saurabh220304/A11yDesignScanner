/**
 * textSpacingRule.ts — WCAG 1.4.12 Text Spacing (AA)
 */

import { AccessibilityRule, AccessibilityIssue } from "../types";
import { isTextNode } from "../utils/nodeUtils";
import { MIN_LINE_HEIGHT_MULTIPLIER, MIN_LETTER_SPACING_MULTIPLIER } from "../utils/wcagUtils";

export const textSpacingRule: AccessibilityRule = {
  id: "text-spacing",
  wcagId: "1.4.12",
  wcagLevel: "AA",
  name: "Text Spacing",
  description: "Text must support overriding line height to 1.5× and letter spacing to 0.12× without loss of content.",
  severity: "medium",
  confidenceLevel: "medium",

  check(node: SceneNode): AccessibilityIssue | null {
    if (!isTextNode(node)) return null;
    const text = node as TextNode;

    const fontSize = (typeof text.fontSize === "number") ? text.fontSize : null;
    if (!fontSize) return null;

    const issues: string[] = [];

    // Line height check
    const lh = text.lineHeight;
    if (lh && typeof lh === "object" && "value" in lh) {
      if (lh.unit === "PIXELS" && lh.value < fontSize * MIN_LINE_HEIGHT_MULTIPLIER) {
        issues.push(`line height (${lh.value}px) is below 1.5× font size (${(fontSize * MIN_LINE_HEIGHT_MULTIPLIER).toFixed(1)}px)`);
      }
      if (lh.unit === "PERCENT" && lh.value < MIN_LINE_HEIGHT_MULTIPLIER * 100) {
        issues.push(`line height (${lh.value}%) is below 150%`);
      }
    }

    // Letter spacing check
    const ls = text.letterSpacing;
    if (ls && typeof ls === "object" && "value" in ls) {
      if (ls.unit === "PIXELS" && ls.value < fontSize * MIN_LETTER_SPACING_MULTIPLIER) {
        // Only flag actively negative or extremely tight spacing
        if (ls.value < 0) {
          issues.push(`letter spacing (${ls.value}px) is negative`);
        }
      }
    }

    if (issues.length === 0) return null;

    return {
      ruleId: "text-spacing",
      wcagId: "1.4.12",
      wcagLevel: "AA",
      severity: "medium",
      confidence: "medium",
      nodeId: node.id,
      nodeName: node.name,
      description: `Text spacing issue(s): ${issues.join("; ")}.`,
      impact: "Users who override text spacing for readability may lose content or functionality.",
      recommendation: "Use line-height ≥ 1.5× the font size. Avoid negative letter-spacing.",
      metadata: { fontSize, lineHeight: text.lineHeight, letterSpacing: text.letterSpacing },
    };
  },
};
