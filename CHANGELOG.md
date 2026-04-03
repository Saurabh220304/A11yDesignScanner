# Changelog

All notable changes to A11y Scanner are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2025-04-03

### Added

**Testing Tools**
- Contrast checker (WCAG 1.4.3 AA) — text contrast with foreground/background hex reporting
- Non-text contrast checker (WCAG 1.4.11) — for icons, borders, and UI controls
- Color-only indicator detector (WCAG 1.4.1) — flags status text with no accompanying icon
- Typography — resize text (WCAG 1.4.4), text spacing (WCAG 1.4.12), reflow (WCAG 1.4.10)
- Touch target size checker (WCAG 2.5.8) — flags elements below 24×24px
- Component state coverage (WCAG 2.4.7 / 4.1.2) — missing Focus/Hover variants

**Annotation Tools (all place layers directly on the Figma canvas)**
- Alt Text — per-image description editor with live best-practice linting, decorative toggle, progress tracker
- Focus Order — interactive reorder list with ↑↓ arrows, Skip toggle, numbered badge placement
- Headings — H1–H6 level picker per text layer with heuristic detection, orange badge placement
- Landmarks — role selector grid (12 roles + custom), dashed border + label placement

**Scoring & Reporting**
- 0–100 accessibility score with A–F grade and Low/Moderate/High/Critical risk level
- Severity filtering (All / High / Medium / Low) on all scan results
- Export to JSON, CSV, and plain-text summary
- One-click "Highlight on canvas" with temporary red outline for every issue

**UI**
- Dark theme design system (#0f0f13 background, blue/purple gradient accents)
- Home screen with Testing Tools + Annotation Tools sections
- Scan Selection / Scan Page for all scanning tools
- Toast notifications for annotation actions
- Per-tool score cards with breakdown chips

### Technical
- Pure ES5 `dist/code.js` — no `const/let`, no arrow functions, no `async/await`, compatible with Figma sandbox
- Font loading via `.then()` Promise chains
- Iterative (stack-based) node traversal — safe for 1000+ node files
- 300ms debounce on scans
- Per-rule try/catch — one bad rule never crashes the full scan
- Zero network requests — fully offline capable
