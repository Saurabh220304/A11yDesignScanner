/**
 * touchSpacingRule.ts
 * Detects interactive elements whose bounding boxes are closer than 8px to each other.
 */

import { AccessibilityRule, AccessibilityIssue } from "../types";
import { isFrameNode, looksInteractive } from "../utils/nodeUtils";
import { absoluteBounds, areTooClose } from "../utils/layoutUtils";
import { MIN_TOUCH_SPACING_PX } from "../utils/wcagUtils";

export const touchSpacingRule: AccessibilityRule = {
  id: "touch-spacing",
  wcagId: "2.5.8",
  wcagLevel: "AA",
  name: "Touch Target Spacing",
  description: `Interactive elements should have at least ${MIN_TOUCH_SPACING_PX}px of space between them.`,
  severity: "low",
  confidenceLevel: "medium",

  check(node: SceneNode): AccessibilityIssue | null {
    if (!isFrameNode(node)) return null;

    const children = (node as FrameNode).children as SceneNode[];
    const interactive = children.filter(looksInteractive);
    if (interactive.length < 2) return null;

    const crowded: string[] = [];

    for (let i = 0; i < interactive.length; i++) {
      for (let j = i + 1; j < interactive.length; j++) {
        const a = absoluteBounds(interactive[i]);
        const b = absoluteBounds(interactive[j]);
        if (areTooClose(a, b, MIN_TOUCH_SPACING_PX)) {
          const pair = `"${interactive[i].name}" ↔ "${interactive[j].name}"`;
          if (!crowded.includes(pair)) crowded.push(pair);
        }
      }
    }

    if (crowded.length === 0) return null;

    return {
      ruleId: "touch-spacing",
      wcagId: "2.5.8",
      wcagLevel: "AA",
      severity: "low",
      confidence: "medium",
      nodeId: node.id,
      nodeName: node.name,
      description: `${crowded.length} pair(s) of interactive elements in "${node.name}" are closer than ${MIN_TOUCH_SPACING_PX}px: ${crowded.slice(0, 2).join(", ")}${crowded.length > 2 ? ` +${crowded.length - 2} more` : ""}.`,
      impact: "Densely packed touch targets are hard to activate accurately, especially on mobile.",
      recommendation: `Increase the spacing between interactive elements to at least ${MIN_TOUCH_SPACING_PX}px.`,
      metadata: { crowdedPairs: crowded.length, minimum: MIN_TOUCH_SPACING_PX },
    };
  },
};
