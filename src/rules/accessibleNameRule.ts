/**
 * accessibleNameRule.ts — WCAG 4.1.2 Name, Role, Value (A)
 * Flags buttons, icon-only elements, and images with generic layer names.
 */

import { AccessibilityRule, AccessibilityIssue } from "../types";
import { isGenericName } from "../utils/wcagUtils";
import { isVectorNode } from "../utils/nodeUtils";

function isButtonLike(node: SceneNode): boolean {
  const name = node.name.toLowerCase();
  return (
    name.includes("button") ||
    name.includes("btn") ||
    name.includes("cta") ||
    node.type === "COMPONENT" ||
    node.type === "INSTANCE"
  );
}

function isImageLike(node: SceneNode): boolean {
  return (
    node.type === "RECTANGLE" &&
    "fills" in node &&
    (node.fills as Paint[]).some((f) => f.type === "IMAGE")
  );
}

function isIconLike(node: SceneNode): boolean {
  return isVectorNode(node) || node.name.toLowerCase().includes("icon");
}

export const accessibleNameRule: AccessibilityRule = {
  id: "accessible-name",
  wcagId: "4.1.2",
  wcagLevel: "A",
  name: "Accessible Name",
  description: "Buttons, icons, and images must have meaningful names, not generic layer names.",
  severity: "high",
  confidenceLevel: "medium",

  check(node: SceneNode): AccessibilityIssue | null {
    const relevant = isButtonLike(node) || isImageLike(node) || isIconLike(node);
    if (!relevant) return null;
    if (!isGenericName(node.name)) return null;

    const kind = isButtonLike(node) ? "button/interactive component"
      : isImageLike(node) ? "image"
      : "icon/graphic";

    return {
      ruleId: "accessible-name",
      wcagId: "4.1.2",
      wcagLevel: "A",
      severity: "high",
      confidence: "medium",
      nodeId: node.id,
      nodeName: node.name,
      description: `This ${kind} has a generic layer name "${node.name}" that won't produce a meaningful accessible name.`,
      impact: "Screen readers will announce the element with a meaningless name, confusing users.",
      recommendation: `Rename this layer to describe its purpose (e.g. "Submit button", "User avatar", "Close icon").`,
      metadata: { nodeType: node.type, kind },
    };
  },
};
