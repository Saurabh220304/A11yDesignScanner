/**
 * reflowRule.ts — WCAG 1.4.10 Reflow (AA)
 * Flags frames wider than 320px with no auto-layout (fixed-width layout).
 */

import { AccessibilityRule, AccessibilityIssue } from "../types";
import { isFrameNode } from "../utils/nodeUtils";
import { hasAutoLayout } from "../utils/layoutUtils";

const REFLOW_THRESHOLD_PX = 320;

export const reflowRule: AccessibilityRule = {
  id: "reflow",
  wcagId: "1.4.10",
  wcagLevel: "AA",
  name: "Reflow",
  description: "Fixed-width frames wider than 320px may cause horizontal scrolling at 400% zoom.",
  severity: "medium",
  confidenceLevel: "medium",

  check(node: SceneNode): AccessibilityIssue | null {
    if (!isFrameNode(node)) return null;

    // Only check top-level or major layout frames
    const isTopLevel = node.parent?.type === "PAGE";
    if (!isTopLevel) return null;

    const frame = node as FrameNode;
    if (frame.width <= REFLOW_THRESHOLD_PX) return null;
    if (hasAutoLayout(frame)) return null;

    return {
      ruleId: "reflow",
      wcagId: "1.4.10",
      wcagLevel: "AA",
      severity: "medium",
      confidence: "medium",
      nodeId: node.id,
      nodeName: node.name,
      description: `Frame "${node.name}" is ${Math.round(frame.width)}px wide with no auto-layout — content may not reflow at 400% zoom (320px viewport equivalent).`,
      impact: "Users with low vision who zoom to 400% may need to scroll horizontally to read content.",
      recommendation: "Enable auto-layout on this frame and use relative sizing so content stacks vertically on narrow viewports.",
      metadata: { width: frame.width, threshold: REFLOW_THRESHOLD_PX },
    };
  },
};
