/**
 * ruleEngine.ts
 * Rule registry, scan orchestration, and scoring.
 */

import { AccessibilityRule, AccessibilityIssue, ScanResult, ScanScope } from "../types";
import { NodeScanner } from "./nodeScanner";

export class RuleEngine {
  private registry: AccessibilityRule[] = [];
  private scanner: NodeScanner;

  constructor() {
    this.scanner = new NodeScanner();
  }

  /** Register a single rule. */
  registerRule(rule: AccessibilityRule): void {
    this.registry.push(rule);
    this.scanner.registerRule(rule);
  }

  /** Register multiple rules at once. */
  registerAll(rules: AccessibilityRule[]): void {
    for (const r of rules) this.registerRule(r);
  }

  /** Run a full scan and return a ScanResult. */
  async runScan(scope: ScanScope): Promise<ScanResult> {
    const { issues, totalNodes } = this.scanner.scan(scope);
    const score = this.calculateScore(issues);
    const grade = this.scoreToGrade(score);
    const riskLevel = this.scoreToRisk(score);

    return {
      totalNodes,
      totalRulesRun: this.registry.length,
      issues,
      score,
      grade,
      riskLevel,
    };
  }

  /** Weighted penalty scoring: high×10, medium×5, low×2. */
  calculateScore(issues: AccessibilityIssue[]): number {
    const highPenalty   = issues.filter((i) => i.severity === "high").length   * 10;
    const mediumPenalty = issues.filter((i) => i.severity === "medium").length * 5;
    const lowPenalty    = issues.filter((i) => i.severity === "low").length    * 2;
    return Math.max(0, 100 - highPenalty - mediumPenalty - lowPenalty);
  }

  private scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
    if (score >= 90) return "A";
    if (score >= 75) return "B";
    if (score >= 50) return "C";
    if (score >= 30) return "D";
    return "F";
  }

  private scoreToRisk(score: number): "low" | "moderate" | "high" | "critical" {
    if (score >= 75) return "low";
    if (score >= 50) return "moderate";
    if (score >= 25) return "high";
    return "critical";
  }
}
