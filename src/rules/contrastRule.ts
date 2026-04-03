/**
 * contrastRule.ts — WCAG 1.4.3 Text Contrast (AA)
 */

import { AccessibilityRule, AccessibilityIssue } from "../types";
import {
  figmaPaintToLuminance,
  contrastRatio,
  meetsContrastRequirement,
  isLargeText,
  figmaRgbToHex,
} from "../utils/colorUtils";
import { isTextNode, getEffectiveBackground } from "../utils/nodeUtils";

export const contrastRule: AccessibilityRule = {
  id: "contrast-text",
  wcagId: "1.4.3",
  wcagLevel: "AA",
  name: "Text Contrast",
  description: "Text must have sufficient contrast against its background.",
  severity: "high",
  confidenceLevel: "high",

  check(node: SceneNode): AccessibilityIssue | null {
    if (!isTextNode(node)) return null;

    const fills = node.fills as Paint[];
    if (!Array.isArray(fills) || fills.length === 0) return null;

    const fgPaint = fills.find((f) => f.type === "SOLID" && (f as SolidPaint).opacity !== 0);
    if (!fgPaint) return null;

    const bgPaint = getEffectiveBackground(node);
    if (!bgPaint) return null;

    const fgLum = figmaPaintToLuminance(fgPaint as SolidPaint);
    const bgLum = figmaPaintToLuminance(bgPaint);
    if (fgLum === null || bgLum === null) return null;

    const ratio = contrastRatio(fgLum, bgLum);
    const large = isLargeText(node as TextNode);
    const passes = meetsContrastRequirement(ratio, large, "AA");

    if (passes) return null;

    const required = large ? 3.0 : 4.5;
    return {
      ruleId: "contrast-text",
      wcagId: "1.4.3",
      wcagLevel: "AA",
      severity: "high",
      confidence: "high",
      nodeId: node.id,
      nodeName: node.name,
      description: `Text contrast ratio is ${ratio.toFixed(2)}:1 — below the required ${required}:1 for ${large ? "large" : "normal"} text.`,
      impact: "Users with low vision may be unable to read this text.",
      recommendation: `Increase contrast to at least ${required}:1. Try darkening the text colour or lightening the background. Foreground: ${figmaRgbToHex((fgPaint as SolidPaint).color)}.`,
      metadata: { contrastRatio: ratio, required, isLargeText: large },
    };
  },
};
