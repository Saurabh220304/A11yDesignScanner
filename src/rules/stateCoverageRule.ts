/**
 * stateCoverageRule.ts
 * Flags component sets that are missing critical interactive states.
 */

import { AccessibilityRule, AccessibilityIssue } from "../types";
import { isComponentSetNode } from "../utils/nodeUtils";

const REQUIRED_STATES = ["default", "hover", "focus", "disabled", "error"];

function getVariantStateValues(componentSet: ComponentSetNode): string[] {
  const values: string[] = [];
  for (const child of componentSet.children) {
    const props = (child as ComponentNode).variantProperties ?? {};
    for (const val of Object.values(props)) {
      values.push((val as string).toLowerCase());
    }
    // Also check the component name itself
    values.push(child.name.toLowerCase());
  }
  return values;
}

export const stateCoverageRule: AccessibilityRule = {
  id: "state-coverage",
  wcagId: "4.1.2",
  wcagLevel: "A",
  name: "Component State Coverage",
  description: "Interactive component sets should include Default, Hover, Focus, Disabled, and Error variants.",
  severity: "medium",
  confidenceLevel: "medium",

  check(node: SceneNode): AccessibilityIssue | null {
    if (!isComponentSetNode(node)) return null;
    const variantValues = getVariantStateValues(node as ComponentSetNode);

    const missing = REQUIRED_STATES.filter(
      (state) => !variantValues.some((v) => v.includes(state))
    );

    // Only flag if Default exists (it's an interactive component) but other states are absent
    const hasDefault = variantValues.some((v) => v.includes("default"));
    if (!hasDefault || missing.length === 0) return null;

    return {
      ruleId: "state-coverage",
      wcagId: "4.1.2",
      wcagLevel: "A",
      severity: "medium",
      confidence: "medium",
      nodeId: node.id,
      nodeName: node.name,
      description: `Component set "${node.name}" is missing state variant(s): ${missing.join(", ")}.`,
      impact: "Missing states mean developers may skip implementing them, breaking keyboard and assistive-tech experiences.",
      recommendation: `Add the missing variant(s): ${missing.join(", ")}. Each state should visually communicate the component's current status.`,
      metadata: { missingStates: missing, variantCount: (node as ComponentSetNode).children.length },
    };
  },
};
