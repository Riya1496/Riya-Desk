---
name: portal-change-numbers
description: Change the made-up sample numbers or dates in the lead portal demo (lead-portal-demo/) and keep every page consistent.
argument-hint: "[the change, e.g. make total leads 320]"
---

Change requested: $ARGUMENTS

The demo's numbers live in `lead-portal-demo/data/sample-data.json` and are also typed into the HTML pages. They must agree everywhere.

1. **Plan the knock-on changes.** Open `data/sample-data.json` and work out every value that has to move so the totals still add up:
   - paid campaigns → paid channels → `paidTotals`
   - channels → `totals`, including cost per policy
   - `funnel` (it must match `paidTotals`)
   - `search` (SEO + Google Business Profile + AI answers)
   - rates and "from X" comparisons

   If more than three values change, show the user a short before/after table and confirm before editing.
2. **Update `data/sample-data.json`.**
3. **Update the pages.** Grep `lead-portal-demo/*.html` for each old value and change:
   - the visible text and table cells
   - `aria-label` text that repeats the numbers
   - bar widths (`style="width: X%"`, usually the value divided by the largest value in that chart)
   - bar heights on the overview trend chart
4. **Check.** Run `npm run check` until it passes, then `npm run shots` for the pages you touched, and look at the screenshots.
5. **Summarize** for the user in plain words: which numbers changed and on which screens.
