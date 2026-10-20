---
name: portal-debug
description: Diagnose and fix something that looks or behaves wrong in the lead portal demo (lead-portal-demo/). Use when the user describes a visual or behaviour problem on a demo page in plain words.
argument-hint: "[what looks wrong, e.g. inbox buttons do nothing on my phone]"
---

The user reports this problem with the lead portal demo: $ARGUMENTS

Work inside `lead-portal-demo/`. Read `lead-portal-demo/CLAUDE.md` first if you haven't this session.

1. **Find the page.** Map the user's words to a file using the page map in `lead-portal-demo/CLAUDE.md`. If it's genuinely unclear which page they mean, ask one short question.
2. **Reproduce it.**
   - `cd lead-portal-demo && npm run check`
   - `npm run shots -- <page-name-without-.html>`. If Playwright is missing, run `npm install`, and if no browser is found, `npx playwright install chromium`.
   - Open `screenshots/desktop/<page>.png` and `screenshots/phone/<page>.png` with the Read tool and look at them. Confirm you can see the problem before changing anything.
3. **Find the cause.**
   - Same look on every page: `assets/styles.css`.
   - Sidebar, demo bar, or Back/Next links: `assets/shell.js`.
   - Buttons that do nothing: the `<script>` at the bottom of that page.
   - Wrong or inconsistent numbers: the page and `data/sample-data.json`.
4. **Fix the smallest thing** that solves the problem. Don't redesign or tidy unrelated code.
5. **Verify.** Re-run `npm run check` and `npm run shots -- <page>`, then look at both screenshots again. Both commands must pass.
6. **Report in plain words:** what was wrong, which files changed, and how you checked. Don't commit or push unless the user asks.
