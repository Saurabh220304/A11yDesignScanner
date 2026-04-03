/**
 * headingRule.ts — WCAG 1.3.1 Heading Hierarchy (A)
 * Detects heading-level skips and missing headings in frames.
 * Uses text style names containing "H1"–"H6" or "Heading 1"–"Heading 6".
 */

import { AccessibilityRule, AccessibilityIssue } from "../types";
import { isTextNode, isFrameNode } from "../utils/nodeUtils";

/** Extract heading level from a style name, e.g. "H1 / Bold" → 1. Returns 0 if not a heading. */
function headingLevel(styleName: string): number {
  const m = styleName.match(/h([1-6])\b|heading\s*([1-6])/i);
  if (!m) return 0;
  return parseInt(m[1] || m[2], 10);
}

/** Collect heading levels from direct text children of a frame. */
function collectHeadingLevels(frame: FrameNode): number[] {
  const levels: number[] = [];
  for (const child of frame.children) {
    if (isTextNode(child)) {
      const text = child as TextNode;
      const styleName = typeof text.textStyleId === "string"
        ? (figma.getStyleById(text.textStyleId)?.name ?? "")
        : "";
      const lv = headingLevel(styleName) || headingLevel(text.name);
      if (lv > 0) levels.push(lv);
    }
  }
  return levels;
}

export const headingRule: AccessibilityRule = {
  id: "heading-hierarchy",
  wcagId: "1.3.1",
  wcagLevel: "A",
  name: "Heading Hierarchy",
  description: "Headings must not skip levels (e.g. H1 → H3 without H2).",
  severity: "medium",
  confidenceLevel: "medium",

  check(node: SceneNode): AccessibilityIssue | null {
    if (!isFrameNode(node)) return null;
    const levels = collectHeadingLevels(node as FrameNode);
    if (levels.length === 0) return null;

    // Check for skipped levels
    const sorted = [...new Set(levels)].sort((a, b) => a - b);
    let skipped = false;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] > 1) { skipped = true; break; }
    }

    // Check for multiple H1s
    const h1Count = levels.filter((l) => l === 1).length;
    const multipleH1 = h1Count > 1;

    if (!skipped && !multipleH1) return null;

    const problems: string[] = [];
    if (skipped) problems.push(`heading levels skip from H${sorted.find((_, i) => i > 0 && sorted[i] - sorted[i-1] > 1)! - 1 > 0 ? sorted.find((_, i) => i > 0 && sorted[i] - sorted[i-1] > 1)! - 1 : "?"} to next level`);
    if (multipleH1) problems.push(`${h1Count} H1 headings found (only one expected per page/frame)`);

    return {
      ruleId: "heading-hierarchy",
      wcagId: "1.3.1",
      wcagLevel: "A",
      severity: "medium",
      confidence: "medium",
      nodeId: node.id,
      nodeName: node.name,
      description: `Heading structure issue: ${problems.join("; ")}.`,
      impact: "Screen reader users rely on heading hierarchy to navigate page structure.",
      recommendation: "Ensure headings follow a logical H1 → H2 → H3 sequence without skipping levels.",
      metadata: { headingLevels: levels },
    };
  },
};
