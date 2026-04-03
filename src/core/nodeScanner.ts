/**
 * nodeScanner.ts
 * Recursively (iteratively) traverses Figma node trees, applying rules.
 */

import { AccessibilityRule, AccessibilityIssue, ScanScope } from "../types";
import { IssueManager } from "./issueManager";
import { traverseNodes } from "../utils/nodeUtils";

export class NodeScanner {
  private rules: AccessibilityRule[] = [];

  registerRule(rule: AccessibilityRule): void {
    this.rules.push(rule);
  }

  scan(scope: ScanScope): { issues: AccessibilityIssue[]; totalNodes: number } {
    let roots: readonly SceneNode[];

    switch (scope) {
      case "selection":
        roots = figma.currentPage.selection;
        break;
      case "page":
      case "file":
      default:
        roots = figma.currentPage.children;
        break;
    }

    const manager = new IssueManager();
    let totalNodes = 0;

    for (const node of traverseNodes(roots)) {
      totalNodes++;
      for (const rule of this.rules) {
        try {
          const issue = rule.check(node);
          if (issue) manager.add(issue);
        } catch (_e) {
          // Silently swallow per-rule errors to keep scan running
        }
      }
    }

    return { issues: manager.getAll(), totalNodes };
  }
}
