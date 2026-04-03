/**
 * sequenceRule.ts — WCAG 1.3.2 Meaningful Sequence (A)
 * Detects when the layer panel order diverges from top-to-bottom / left-to-right visual order.
 */

import { AccessibilityRule, AccessibilityIssue } from "../types";
import { isFrameNode } from "../utils/nodeUtils";
import { readingOrder } from "../utils/layoutUtils";

export const sequenceRule: AccessibilityRule = {
  id: "reading-sequence",
  wcagId: "1.3.2",
  wcagLevel: "A",
  name: "Reading Sequence",
  description: "Layer order should match the visual reading order (top-to-bottom, left-to-right).",
  severity: "medium",
  confidenceLevel: "low",

  check(node: SceneNode): AccessibilityIssue | null {
    if (!isFrameNode(node)) return null;
    const frame = node as FrameNode;
    if (frame.children.length < 2) return null;

    const children = frame.children as SceneNode[];
    // Figma layers are listed bottom-up in the API; reverse so index 0 = top layer
    const layerOrder = [...children].reverse();
    const visualOrder = readingOrder(children);

    // Compare IDs
    const layerIds  = layerOrder.map((c) => c.id);
    const visualIds = visualOrder.map((c) => c.id);

    let mismatches = 0;
    for (let i = 0; i < layerIds.length; i++) {
      if (layerIds[i] !== visualIds[i]) mismatches++;
    }

    const threshold = Math.ceil(children.length * 0.3); // Flag if >30% mismatch
    if (mismatches < threshold) return null;

    return {
      ruleId: "reading-sequence",
      wcagId: "1.3.2",
      wcagLevel: "A",
      severity: "medium",
      confidence: "low",
      nodeId: node.id,
      nodeName: node.name,
      description: `Layer order in "${node.name}" may not match the visual reading order (${mismatches} of ${children.length} layers out of sequence).`,
      impact: "Screen readers follow layer order, which may produce a confusing read sequence.",
      recommendation: "Reorder layers in the panel to match the visual top-to-bottom, left-to-right reading order.",
      metadata: { totalChildren: children.length, mismatches },
    };
  },
};
