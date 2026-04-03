/**
 * resizeTextRule.ts — WCAG 1.4.4 Resize Text (AA)
 */

import { AccessibilityRule, AccessibilityIssue } from "../types";
import { isTextNode } from "../utils/nodeUtils";

export const resizeTextRule: AccessibilityRule = {
  id: "resize-text",
  wcagId: "1.4.4",
  wcagLevel: "AA",
  name: "Resize Text",
  description: "Text containers with a fixed height and no text auto-resize may clip at 200% zoom.",
  severity: "medium",
  confidenceLevel: "medium",

  check(node: SceneNode): AccessibilityIssue | null {
    if (!isTextNode(node)) return null;
    const text = node as TextNode;

    // textAutoResize = "NONE" means both width AND height are fixed
    if (text.textAutoResize !== "NONE") return null;

    return {
      ruleId: "resize-text",
      wcagId: "1.4.4",
      wcagLevel: "AA",
      severity: "medium",
      confidence: "medium",
      nodeId: node.id,
      nodeName: node.name,
      description: "This text layer has a fixed width and height — text will be clipped when the user zooms to 200%.",
      impact: "Users who increase text size may lose access to content.",
      recommendation: "Set text resizing to 'Auto Height' or 'Auto Width/Height' in the Figma design panel.",
      metadata: { textAutoResize: text.textAutoResize },
    };
  },
};
