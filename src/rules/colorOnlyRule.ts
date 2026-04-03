/**
 * colorOnlyRule.ts
 * Detects text layers that use red or green as the ONLY visual indicator
 * of meaning (e.g. "Error" or "Success" with no icon or secondary label).
 */

import { AccessibilityRule, AccessibilityIssue } from "../types";
import { isTextNode, getSolidFill, isParentNode } from "../utils/nodeUtils";

/** Very rough check: is this colour strongly red or green? */
function isRedOrGreen(r: number, g: number, b: number): "red" | "green" | null {
  if (r > 180 && g < 100 && b < 100) return "red";
  if (g > 150 && r < 100 && b < 100) return "green";
  return null;
}

/** Check whether a sibling icon exists near this text node. */
function hasSiblingIcon(node: SceneNode): boolean {
  const parent = node.parent;
  if (!parent || !isParentNode(parent)) return false;
  return (parent.children as SceneNode[]).some(
    (sibling) =>
      sibling.id !== node.id &&
      (sibling.type === "VECTOR" ||
        sibling.type === "BOOLEAN_OPERATION" ||
        sibling.name.toLowerCase().includes("icon"))
  );
}

export const colorOnlyRule: AccessibilityRule = {
  id: "color-only",
  wcagId: "1.4.1",
  wcagLevel: "A",
  name: "Color Not Sole Indicator",
  description: "Information must not be conveyed by colour alone.",
  severity: "medium",
  confidenceLevel: "medium",

  check(node: SceneNode): AccessibilityIssue | null {
    if (!isTextNode(node)) return null;

    const fill = getSolidFill(node);
    if (!fill) return null;

    const { r, g, b } = fill.color;
    const colorType = isRedOrGreen(
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255)
    );
    if (!colorType) return null;

    // If there is a sibling icon, the colour is not the only indicator
    if (hasSiblingIcon(node)) return null;

    const label = colorType === "red" ? "red (error/danger)" : "green (success/valid)";

    return {
      ruleId: "color-only",
      wcagId: "1.4.1",
      wcagLevel: "A",
      severity: "medium",
      confidence: "medium",
      nodeId: node.id,
      nodeName: node.name,
      description: `Text "${node.name}" uses ${label} as the only visual indicator — no accompanying icon detected.`,
      impact: "Colour-blind users and those on high-contrast displays cannot perceive the meaning.",
      recommendation: "Add an icon (e.g. ✓ or ✗), a text label, or an underline/border pattern alongside the colour.",
      metadata: { colorType },
    };
  },
};
