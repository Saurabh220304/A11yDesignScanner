/**
 * focusOrderRule.ts — WCAG 2.4.3 Focus Order (A)
 * Simulates tab order by sorting interactive nodes by Y then X position.
 * Flags frames where interactive children are in an unexpected spatial order
 * relative to their layer order.
 */

import { AccessibilityRule, AccessibilityIssue } from "../types";
import { isFrameNode, looksInteractive } from "../utils/nodeUtils";
import { readingOrder } from "../utils/layoutUtils";

export const focusOrderRule: AccessibilityRule = {
  id: "focus-order",
  wcagId: "2.4.3",
  wcagLevel: "A",
  name: "Focus Order",
  description: "Interactive elements should receive focus in a logical, predictable order.",
  severity: "medium",
  confidenceLevel: "low",

  check(node: SceneNode): AccessibilityIssue | null {
    if (!isFrameNode(node)) return null;
    const frame = node as FrameNode;

    const interactive = (frame.children as SceneNode[]).filter(looksInteractive);
    if (interactive.length < 2) return null;

    // Layer order (reversed for top-first)
    const layerOrder = [...interactive].reverse();
    const visualOrder = readingOrder(interactive);

    const layerIds  = layerOrder.map((c) => c.id);
    const visualIds = visualOrder.map((c) => c.id);

    let mismatches = 0;
    for (let i = 0; i < layerIds.length; i++) {
      if (layerIds[i] !== visualIds[i]) mismatches++;
    }

    if (mismatches === 0) return null;

    return {
      ruleId: "focus-order",
      wcagId: "2.4.3",
      wcagLevel: "A",
      severity: "medium",
      confidence: "low",
      nodeId: node.id,
      nodeName: node.name,
      description: `Focus order in "${node.name}" may not follow the visual layout — ${mismatches} interactive element(s) appear out of sequence.`,
      impact: "Keyboard users may experience a confusing or illogical tab sequence.",
      recommendation: "Reorder interactive layers in the panel to match the visual reading order: top-to-bottom, left-to-right.",
      metadata: { interactiveCount: interactive.length, mismatches },
    };
  },
};
