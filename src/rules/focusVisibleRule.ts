/**
 * focusVisibleRule.ts — WCAG 2.4.7 Focus Visible (AA)
 * Detects component sets that have a Default variant but no Focus variant.
 */

import { AccessibilityRule, AccessibilityIssue } from "../types";
import { isComponentSetNode } from "../utils/nodeUtils";

function getVariantNames(componentSet: ComponentSetNode): string[] {
  return componentSet.children.map((child) => {
    const props = (child as ComponentNode).variantProperties ?? {};
    // Collect all variant values
    return Object.values(props).join(",").toLowerCase();
  });
}

export const focusVisibleRule: AccessibilityRule = {
  id: "focus-visible",
  wcagId: "2.4.7",
  wcagLevel: "AA",
  name: "Focus Visible",
  description: "Interactive component sets must include a Focus variant.",
  severity: "high",
  confidenceLevel: "high",

  check(node: SceneNode): AccessibilityIssue | null {
    if (!isComponentSetNode(node)) return null;

    const variantValues = getVariantNames(node as ComponentSetNode);
    const hasDefault = variantValues.some((v) => v.includes("default"));
    const hasFocus   = variantValues.some((v) => v.includes("focus") || v.includes("focused"));

    if (!hasDefault || hasFocus) return null;

    return {
      ruleId: "focus-visible",
      wcagId: "2.4.7",
      wcagLevel: "AA",
      severity: "high",
      confidence: "high",
      nodeId: node.id,
      nodeName: node.name,
      description: `Component set "${node.name}" has a Default variant but no Focus variant.`,
      impact: "Keyboard users will not see a visual focus indicator on this component.",
      recommendation: 'Add a "Focus" variant with a clearly visible focus ring (outline, glow, or border change).',
      metadata: { variantCount: (node as ComponentSetNode).children.length },
    };
  },
};
