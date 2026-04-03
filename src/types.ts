// ─── Core Data Models ────────────────────────────────────────────────────────

export interface AccessibilityRule {
  id: string;
  wcagId: string;
  wcagLevel: "A" | "AA" | "AAA";
  name: string;
  description: string;
  severity: "high" | "medium" | "low";
  confidenceLevel: "high" | "medium" | "low";
  check: (node: SceneNode) => AccessibilityIssue | null;
}

export interface AccessibilityIssue {
  ruleId: string;
  wcagId: string;
  wcagLevel: "A" | "AA" | "AAA";
  severity: "high" | "medium" | "low";
  confidence: "high" | "medium" | "low";
  nodeId: string;
  nodeName: string;
  description: string;
  impact: string;
  recommendation: string;
  metadata?: Record<string, unknown>;
}

export interface ScanResult {
  totalNodes: number;
  totalRulesRun: number;
  issues: AccessibilityIssue[];
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  riskLevel: "low" | "moderate" | "high" | "critical";
}

export type ScanScope = "selection" | "page" | "file";

// ─── UI Messages ─────────────────────────────────────────────────────────────

export interface PluginMessage {
  type: string;
  [key: string]: unknown;
}
