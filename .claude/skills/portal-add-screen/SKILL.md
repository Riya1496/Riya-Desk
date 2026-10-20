---
name: portal-add-screen
description: Add a new screen to the lead portal demo (lead-portal-demo/), wired into the tour, the sidebar, the start page and the checks.
argument-hint: "[what the new screen shows]"
---

New screen to add: $ARGUMENTS

1. **Start from the closest existing page.** Copy `overview.html` for a portal screen with the sidebar, or `setup.html` for a standalone page. Name the new file in kebab-case, e.g. `billing.html`.
2. **Set the basics:** `<title>Name · Lead Portal Demo</title>`, `<body data-page="billing.html">`, and for portal screens `data-active="billing.html"` on the `<nav data-nav>` placeholder. Keep the noindex meta, the shared stylesheet and `assets/shell.js`.
3. **Wire it in:**
   - Add it to `JOURNEY` in `assets/shell.js`, at the right point in the tour.
   - For a portal menu item, add it to `NAV_FULL`. If it should show as locked on the free plan, add it to `NAV_FREE` too.
   - Add a card for it to `index.html` in the right stage.
4. **Build the content** with existing classes from `assets/styles.css` (`card`, `kpis`, `kpi`, `row`, `grow-1`, `grow-2`, `data` tables in `.table-wrap`, `pill`, `btn`). If new CSS is needed, add it at the end of `styles.css` in a commented section.
5. **Keep numbers consistent.** Any new sample numbers go in `data/sample-data.json` (and `shownOn` for key figures), and must agree with the other screens.
6. **Interactive parts:** put a small script at the bottom of the page, use real `<button>` elements with `aria-pressed` where they toggle, and add a click test to `INTERACTIONS` in `tools/screenshots.mjs`.
7. **Check:** run `npm run check` and `npm run shots -- <file>`, then look at the desktop and phone screenshots. Nothing may scroll sideways on a phone.
8. **Tell the user** what the screen shows and where it sits in the tour.
