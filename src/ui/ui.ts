/**
 * ui.ts — Plugin UI logic: event handlers and message bridge to code.ts
 */

import { ScanResult, AccessibilityIssue } from "../types";

// ─── State ───────────────────────────────────────────────────────────────────
let currentResult: ScanResult | null = null;
let activeFilter: "all" | "high" | "medium" | "low" = "all";

// ─── Element refs ────────────────────────────────────────────────────────────
const emptyState   = document.getElementById("empty-state")!;
const loadingEl    = document.getElementById("loading")!;
const scorePanel   = document.getElementById("score-panel")!;
const filterBar    = document.getElementById("filter-bar")!;
const issueList    = document.getElementById("issue-list")!;
const noIssues     = document.getElementById("no-issues")!;
const footer       = document.getElementById("footer")!;
const exportBtn    = document.getElementById("export-btn")!;
const exportMenu   = document.getElementById("export-menu")!;
const scoreNumber  = document.getElementById("score-number")!;
const scoreGrade   = document.getElementById("score-grade")!;
const riskBadge    = document.getElementById("risk-badge")!;
const scoreSummary = document.getElementById("score-summary")!;
const countHigh    = document.getElementById("count-high")!;
const countMedium  = document.getElementById("count-medium")!;
const countLow     = document.getElementById("count-low")!;
const btnScanSel   = document.getElementById("btn-scan-selection")!;
const btnScanPage  = document.getElementById("btn-scan-page")!;

// ─── Scan buttons ─────────────────────────────────────────────────────────────
btnScanSel.addEventListener("click", () => {
  startScan("selection");
});

btnScanPage.addEventListener("click", () => {
  startScan("page");
});

function startScan(scope: "selection" | "page") {
  showLoading();
  parent.postMessage({ pluginMessage: { type: "scan", scope } }, "*");
}

// ─── Filter bar ───────────────────────────────────────────────────────────────
document.querySelectorAll<HTMLButtonElement>(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeFilter = (btn.dataset.filter as typeof activeFilter) || "all";
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    applyFilter();
  });
});

function applyFilter() {
  document.querySelectorAll<HTMLElement>(".issue-card").forEach((card) => {
    const sev = card.dataset.severity ?? "";
    card.classList.toggle("hidden", activeFilter !== "all" && sev !== activeFilter);
  });

  const visible = document.querySelectorAll(".issue-card:not(.hidden)").length;
  noIssues.style.display = visible === 0 && currentResult ? "flex" : "none";
  issueList.style.display = visible > 0 ? "flex" : "none";
}

// ─── Export menu ──────────────────────────────────────────────────────────────
exportBtn.addEventListener("click", () => {
  exportMenu.style.display = exportMenu.style.display === "block" ? "none" : "block";
});

document.querySelectorAll<HTMLButtonElement>("[data-format]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!currentResult) return;
    exportMenu.style.display = "none";
    parent.postMessage({
      pluginMessage: { type: "export", format: btn.dataset.format, result: currentResult },
    }, "*");
  });
});

// Close export menu on outside click
document.addEventListener("click", (e) => {
  if (!exportBtn.contains(e.target as Node) && !exportMenu.contains(e.target as Node)) {
    exportMenu.style.display = "none";
  }
});

// ─── Message handler from code.ts ────────────────────────────────────────────
window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;

  switch (msg.type) {
    case "scan-start":
      showLoading();
      break;

    case "scan-result":
      currentResult = msg.result as ScanResult;
      renderResult(currentResult);
      break;

    case "scan-error":
      showEmptyState();
      console.error("Scan error:", msg.message);
      break;

    case "export-ready":
      downloadFile(msg.content as string, msg.filename as string);
      break;

    case "selection-changed":
      btnScanSel.disabled = (msg.count as number) === 0;
      break;
  }
};

// ─── Render result ────────────────────────────────────────────────────────────
function renderResult(result: ScanResult) {
  // Score panel
  const gradeClass = `grade-${result.grade}`;
  scoreNumber.textContent = String(result.score);
  scoreNumber.className   = `score-number ${gradeClass}`;
  scoreGrade.textContent  = result.grade;
  scoreGrade.className    = `score-grade ${gradeClass}`;
  document.getElementById("score-circle")!.className = `score-circle ${gradeClass}`;

  riskBadge.textContent  = result.riskLevel.toUpperCase();
  riskBadge.className    = `risk-badge risk-${result.riskLevel}`;

  const h = result.issues.filter((i) => i.severity === "high").length;
  const m = result.issues.filter((i) => i.severity === "medium").length;
  const l = result.issues.filter((i) => i.severity === "low").length;

  scoreSummary.textContent = `${result.issues.length} issue${result.issues.length !== 1 ? "s" : ""} across ${result.totalNodes} node${result.totalNodes !== 1 ? "s" : ""}`;
  countHigh.textContent   = String(h);
  countMedium.textContent = String(m);
  countLow.textContent    = String(l);

  // Issue cards
  issueList.innerHTML = "";
  for (const issue of result.issues) {
    issueList.appendChild(createIssueCard(issue));
  }

  // Show/hide sections
  emptyState.style.display  = "none";
  loadingEl.style.display   = "none";
  scorePanel.style.display  = "flex";
  filterBar.style.display   = "flex";
  footer.style.display      = "block";
  issueList.style.display   = result.issues.length > 0 ? "flex" : "none";
  noIssues.style.display    = result.issues.length === 0 ? "flex" : "none";

  activeFilter = "all";
  document.querySelectorAll(".filter-btn").forEach((b) => {
    b.classList.toggle("active", (b as HTMLElement).dataset.filter === "all");
  });
}

// ─── Issue card ───────────────────────────────────────────────────────────────
function createIssueCard(issue: AccessibilityIssue): HTMLElement {
  const card = document.createElement("div");
  card.className = "issue-card";
  card.dataset.severity = issue.severity;

  const dotClass    = `severity-dot sev-${issue.severity}`;
  const badgeClass  = `severity-badge badge-${issue.severity}`;

  card.innerHTML = `
    <div class="issue-header">
      <span class="${dotClass}"></span>
      <div class="issue-title-wrap">
        <div class="issue-title">${escapeHtml(issue.description.slice(0, 80))}${issue.description.length > 80 ? "…" : ""}</div>
        <div class="issue-wcag">WCAG ${issue.wcagId} ${issue.wcagLevel} · ${escapeHtml(issue.nodeName)}</div>
      </div>
      <span class="${badgeClass}">${issue.severity}</span>
      <span class="issue-expand-icon">▶</span>
    </div>
    <div class="issue-body">
      <div class="issue-description">${escapeHtml(issue.description)}</div>
      <div class="issue-node">Layer: ${escapeHtml(issue.nodeName)}</div>
      <div class="recommendation-label">Recommendation</div>
      <div class="recommendation-text">${escapeHtml(issue.recommendation)}</div>
      <div class="issue-actions">
        <button class="btn-highlight" data-node-id="${issue.nodeId}">▶ Highlight on canvas</button>
      </div>
    </div>
  `;

  // Expand/collapse
  const header = card.querySelector(".issue-header")!;
  header.addEventListener("click", () => {
    card.classList.toggle("expanded");
  });

  // Highlight
  const highlightBtn = card.querySelector<HTMLButtonElement>(".btn-highlight")!;
  highlightBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    parent.postMessage({ pluginMessage: { type: "highlight", nodeId: issue.nodeId } }, "*");
  });

  return card;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function showLoading() {
  emptyState.style.display  = "none";
  loadingEl.style.display   = "flex";
  scorePanel.style.display  = "none";
  filterBar.style.display   = "none";
  issueList.style.display   = "none";
  noIssues.style.display    = "none";
  footer.style.display      = "none";
}

function showEmptyState() {
  emptyState.style.display  = "flex";
  loadingEl.style.display   = "none";
  scorePanel.style.display  = "none";
  filterBar.style.display   = "none";
  issueList.style.display   = "none";
  footer.style.display      = "none";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
showEmptyState();
