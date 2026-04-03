/**
 * targetSizeRule.ts — WCAG 2.5.8 Target Size Minimum (AA)
 */

import { AccessibilityRule, AccessibilityIssue } from "../types";
import { looksInteractive } from "../utils/nodeUtils";
import { MIN_TARGET_SIZE_PX } from "../utils/wcagUtils";

export const targetSizeRule: AccessibilityRule = {
  id: "target-size",
  wcagId: "2.5.8",
  wcagLevel: "AA",
  name: "Target Size (Minimum)",
  description: `Interactive components must be at least ${MIN_TARGET_SIZE_PX}×${MIN_TARGET_SIZE_PX}px.`,
  severity: "high",
  confidenceLevel: "high",

  check(node: SceneNode): AccessibilityIssue | null {
    if (!looksInteractive(node)) return null;

    const w = node.width;
    const h = node.height;
    if (w >= MIN_TARGET_SIZE_PX && h >= MIN_TARGET_SIZE_PX) return null;

    const axis = w < MIN_TARGET_SIZE_PX && h < MIN_TARGET_SIZE_PX
      ? "width and height"
      : w < MIN_TARGET_SIZE_PX ? "width" : "height";

    return {
      ruleId: "target-size",
      wcagId: "2.5.8",
      wcagLevel: "AA",
      severity: "high",
      confidence: "high",
      nodeId: node.id,
      nodeName: node.name,
      description: `Interactive element "${node.name}" is ${w}×${h}px — ${axis} is below the ${MIN_TARGET_SIZE_PX}px minimum.`,
      impact: "Small touch targets are difficult or impossible to activate for users with motor impairments.",
      recommendation: `Increase ${axis} to at least ${MIN_TARGET_SIZE_PX}px. If needed, add transparent padding around the visible target.`,
      metadata: { width: w, height: h, minimum: MIN_TARGET_SIZE_PX },
    };
  },
};
