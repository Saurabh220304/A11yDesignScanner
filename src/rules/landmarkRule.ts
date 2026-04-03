/**
 * landmarkRule.ts — WCAG 1.3.1 Semantic Frame Naming (A)
 */

import { AccessibilityRule, AccessibilityIssue } from "../types";
import { isFrameNode } from "../utils/nodeUtils";
import { LANDMARK_NAMES } from "../utils/wcagUtils";

/** Is this a top-level frame on the page? */
function isTopLevelFrame(node: SceneNode): boolean {
  return isFrameNode(node) && node.parent?.type === "PAGE";
}

function hasLandmarkName(name: string): boolean {
  const lower = name.toLowerCase();
  return LANDMARK_NAMES.some((l) => lower.includes(l));
}

export const landmarkRule: AccessibilityRule = {
  id: "landmark-naming",
  wcagId: "1.3.1",
  wcagLevel: "A",
  name: "Landmark Naming",
  description: "Top-level frames should use semantic names like Header, Nav, Main, Footer, Sidebar, or Search.",
  severity: "low",
  confidenceLevel: "medium",

  check(node: SceneNode): AccessibilityIssue | null {
    if (!isTopLevelFrame(node)) return null;
    if (hasLandmarkName(node.name)) return null;

    return {
      ruleId: "landmark-naming",
      wcagId: "1.3.1",
      wcagLevel: "A",
      severity: "low",
      confidence: "medium",
      nodeId: node.id,
      nodeName: node.name,
      description: `Top-level frame "${node.name}" does not use a semantic landmark name.`,
      impact: "Developers may not map this frame to the correct HTML landmark element.",
      recommendation: `Rename this frame to one of: Header, Nav, Main, Footer, Sidebar, Search, or include the landmark name in its name (e.g. "Main Content").`,
      metadata: { frameName: node.name },
    };
  },
};
