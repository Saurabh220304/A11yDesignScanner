/**
 * placeholderLabelRule.ts
 * Detects input fields where the only label-like text is inside the field (placeholder pattern).
 */

import { AccessibilityRule, AccessibilityIssue } from "../types";
import { isParentNode, isTextNode } from "../utils/nodeUtils";

function looksLikeInput(node: SceneNode): boolean {
  const name = node.name.toLowerCase();
  return (
    name.includes("input") ||
    name.includes("text field") ||
    name.includes("textfield") ||
    name.includes("text-field") ||
    name.includes("form field") ||
    name.includes("search") ||
    name.includes("email") ||
    name.includes("password") ||
    name.includes("phone") ||
    name.includes("field")
  );
}

/** Check whether there's a visible text label OUTSIDE the input bounds. */
function hasExternalLabel(node: SceneNode): boolean {
  const parent = node.parent;
  if (!parent || !isParentNode(parent)) return false;

  const ab = node.absoluteBoundingBox;
  if (!ab) return false;

  for (const sibling of parent.children as SceneNode[]) {
    if (sibling.id === node.id) continue;
    if (!isTextNode(sibling)) continue;
    const sib = sibling.absoluteBoundingBox;
    if (!sib) continue;
    // Label is above or to the left of the field
    const isAbove = sib.y + sib.height <= ab.y + 4;
    const isLeft  = sib.x + sib.width  <= ab.x + 4;
    if (isAbove || isLeft) return true;
  }
  return false;
}

/** Find inner text of an input-like node that looks like placeholder text. */
function hasOnlyInternalText(node: SceneNode): boolean {
  if (!isParentNode(node)) return false;
  const texts = (node.children as SceneNode[]).filter(isTextNode);
  return texts.length > 0;
}

export const placeholderLabelRule: AccessibilityRule = {
  id: "placeholder-label",
  wcagId: "1.3.1",
  wcagLevel: "A",
  name: "Placeholder as Label",
  description: "Input fields must have a visible label outside the field, not just placeholder text.",
  severity: "medium",
  confidenceLevel: "medium",

  check(node: SceneNode): AccessibilityIssue | null {
    if (!looksLikeInput(node)) return null;
    if (hasExternalLabel(node)) return null;
    if (!hasOnlyInternalText(node)) return null;

    return {
      ruleId: "placeholder-label",
      wcagId: "1.3.1",
      wcagLevel: "A",
      severity: "medium",
      confidence: "medium",
      nodeId: node.id,
      nodeName: node.name,
      description: `Input "${node.name}" appears to use only internal placeholder text — no external label detected.`,
      impact: "Placeholder text disappears when the user types, leaving them with no label to reference. Screen readers may also fail to announce the field's purpose.",
      recommendation: "Add a persistent visible label above or to the left of the input field.",
      metadata: { nodeName: node.name },
    };
  },
};
