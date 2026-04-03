/**
 * nonTextContrastRule.ts — WCAG 1.4.11 Non-text Contrast (AA)
 */

import { AccessibilityRule, AccessibilityIssue } from "../types";
import { figmaPaintToLuminance, contrastRatio } from "../utils/colorUtils";
import { getEffectiveBackground, isVectorNode } from "../utils/nodeUtils";
import { CONTRAST_THRESHOLDS } from "../utils/wcagUtils";

/** Heuristic: is this node likely a UI control or icon? */
function isIconOrControl(node: SceneNode): boolean {
  const name = node.name.toLowerCase();
  return (
    isVectorNode(node) ||
    node.type === "BOOLEAN_OPERATION" ||
    name.includes("icon") ||
    name.includes("border") ||
    name.includes("divider") ||
    name.includes("input") ||
    name.includes("focus") ||
    name.includes("checkbox") ||
    name.includes("radio") ||
    name.includes("toggle")
  );
}

export const nonTextContrastRule: AccessibilityRule = {
  id: "contrast-non-text",
  wcagId: "1.4.11",
  wcagLevel: "AA",
  name: "Non-text Contrast",
  description: "UI components and graphical objects must have a contrast ratio of at least 3:1 against adjacent colours.",
  severity: "high",
  confidenceLevel: "medium",

  check(node: SceneNode): AccessibilityIssue | null {
    if (!isIconOrControl(node)) return null;

    const fills = "fills" in node ? (node.fills as Paint[]) : [];
    const strokes = "strokes" in node ? (node.strokes as Paint[]) : [];

    const relevantPaint =
      strokes.find((p) => p.type === "SOLID") ||
      fills.find((p) => p.type === "SOLID");

    if (!relevantPaint) return null;

    const bgPaint = getEffectiveBackground(node);
    if (!bgPaint) return null;

    const fgLum = figmaPaintToLuminance(relevantPaint as SolidPaint);
    const bgLum = figmaPaintToLuminance(bgPaint);
    if (fgLum === null || bgLum === null) return null;

    const ratio = contrastRatio(fgLum, bgLum);
    if (ratio >= CONTRAST_THRESHOLDS.nonText) return null;

    return {
      ruleId: "contrast-non-text",
      wcagId: "1.4.11",
      wcagLevel: "AA",
      severity: "high",
      confidence: "medium",
      nodeId: node.id,
      nodeName: node.name,
      description: `Non-text element has a contrast ratio of ${ratio.toFixed(2)}:1 — below the required 3:1.`,
      impact: "Users with low vision may not be able to perceive this icon or control boundary.",
      recommendation: "Increase the stroke or fill contrast to at least 3:1 against its background.",
      metadata: { contrastRatio: ratio, required: 3.0 },
    };
  },
};
