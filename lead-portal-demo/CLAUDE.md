# Lead Portal Demo

A clickable sales demo of a lead-conversion client portal, shown for a fictional insurance agency, Northline Insurance. Every number is made up. The demo lives inside the riyadesk.com repo and is served at https://riyadesk.com/lead-portal-demo/ once it is pushed to `main`.

The owner is not a developer. Expect requests in plain words ("the inbox looks broken on my phone", "change the leads to 320"). Do the technical work, then explain the result in plain words.

## How it's built

- Plain HTML, CSS and JS. No framework and no build step: the files in this folder are exactly what gets served.
- One page per screen, all in this folder. The tour order lives in `JOURNEY` in `assets/shell.js`.
- `assets/styles.css` holds all styles. Colors are tokens on `:root`. Reuse existing classes before adding new ones, and add new CSS at the end of the file in a commented section.
- `assets/shell.js` draws the dark "Sample demo" bar (Back / All screens / Next) and the portal sidebar on every page. Change menu items there, never inside a page.
- `data/sample-data.json` is the source of truth for the sample numbers, and lists which pages show which key numbers (`shownOn`).
- Interactive pages keep a small script at the bottom of the page itself:
  - `inbox.html`: the lead list (the `LEADS` array) and the outcome buttons
  - `insights.html`: Approve / Discuss first
  - `onboarding.html`: the three steps and the connect buttons
  - `book-consult.html`: the day and time picker
  - `setup.html`: the "what we need from you" checklist
  - `signup.html`: the form (it only moves on to onboarding, nothing is sent)
- `tools/` holds the checks: `check.mjs` (fast, no browser), `screenshots.mjs` (real browser), `serve.mjs` (local server).

## Page map

| The user might say | File |
|---|---|
| demo start, list of screens, guide | `index.html` |
| website, landing page, marketing page | `website.html` |
| sign up, create account | `signup.html` |
| onboarding, connect sources, setup steps (free) | `onboarding.html` |
| free plan, free dashboard, score, locked features | `free-plan.html` |
| booking, consult, calendar, pick a time | `book-consult.html` |
| setup tracker, go-live, what we need from you | `setup.html` |
| overview, dashboard, home of the portal | `overview.html` |
| all channels, channel mix, cost per policy | `channels.html` |
| SEO, Google Maps, reviews, AI answers, ChatGPT | `search-ai.html` |
| lead quality, paid sources, campaigns, verdicts | `lead-quality.html` |
| inbox, leads list, mark outcome, qualified / bound buttons | `inbox.html` |
| funnel, drop-off, quotes not bound | `funnel.html` |
| weekly insight, recommendations, approve, learning log | `insights.html` |
| what leads see, text messages, phones | `lead-view.html` |
| weekly email, Monday email | `weekly-email.html` |
| how it connects, diagram, Zapier | `how-it-connects.html` |
| sidebar, menu, demo bar, Next / Back links | `assets/shell.js` |
| colors, fonts, spacing on every page | `assets/styles.css` |

## Commands (run inside `lead-portal-demo/`)

- `npm run check`: fast check, no browser. Finds broken links, missing pages, pages missing from the tour, numbers that don't add up, and numbers missing from the pages that should show them. Run it after every change.
- `npm run shots`: opens every page in Chromium at desktop (1280 wide) and phone (390 wide) sizes. It saves screenshots to `screenshots/desktop/` and `screenshots/phone/`, reports console errors and sideways scrolling, and clicks the main controls. Use `npm run shots -- inbox` to test one page.
  - First time on a new machine: `npm install`, then `npx playwright install chromium`. If Chromium is already installed elsewhere, set `CHROMIUM_PATH` to it instead.
- `npm run serve`: serves the demo at http://localhost:4321/

## How to debug (prompt-based)

When the user describes a problem:

1. Map their words to a file using the page map. If it's genuinely unclear, ask one short question.
2. Reproduce it: run `npm run check`, then `npm run shots -- <page>`. Open the desktop and phone screenshots with the Read tool and look at them. Don't guess from the code alone.
3. Find the cause:
   - Shared look: `assets/styles.css`.
   - Sidebar or demo bar: `assets/shell.js`.
   - Buttons that do nothing: the script at the bottom of that page.
   - Wrong or inconsistent numbers: the page plus `data/sample-data.json`.
4. Make the smallest fix that solves it. Don't redesign while debugging.
5. Re-run `npm run check` and `npm run shots -- <page>`, and look at the screenshots again.
6. Tell the user in plain words what was wrong and what changed. Don't commit or push unless they ask.

## Rules

- Every page keeps the noindex robots meta, `data-page` on `<body>`, the shared stylesheet and `assets/shell.js`. `npm run check` enforces this.
- Keep the "Sample demo · made-up data" bar and the "Sample data" tags. Never present the numbers as real results.
- Never invent testimonials, client logos or results. Placeholders such as `[Client result]`, `[Your brand]`, `[YOUR PRICE]` and `[Consultant name]` stay until the user supplies the real thing.
- Insurance copy rules shown in the demo:
  - Automated texts only schedule calls. They never give quotes or coverage advice.
  - Leads are contacted only with recorded consent.
  - Texts go out between 8 am and 9 pm, the lead's local time.
- Numbers must stay consistent. When one changes, update `data/sample-data.json` and every page that shows it, then run `npm run check`.
- Accessibility: real `<button>` and `<a>` elements, `aria-pressed` on toggles, touch targets of at least 44px, and `role="img"` with an `aria-label` on picture-like blocks.
- Phone width: nothing may scroll sideways. Wide tables go inside `.table-wrap`.
- Stay inside `lead-portal-demo/`. The rest of the repo is the riyadesk.com portfolio, so don't touch it unless the user asks.
- Don't put double curly braces or curly-brace-percent sequences in Markdown files here. GitHub Pages runs Jekyll, which would try to process them.

## Deploying

- riyadesk.com is served from the `main` branch of Riya1496/Riya-Desk (the repo has a `CNAME`). Pushing this folder to `main` makes the demo live at https://riyadesk.com/lead-portal-demo/ within a few minutes.
- Before pushing, run `npm run check` and `npm run shots`. Both must pass.
- Push to `main` only when the user asks. Otherwise push a branch and open a pull request.

## Project skills

- `/portal-debug`: describe what looks wrong and it gets fixed.
- `/portal-change-numbers`: change sample numbers and keep every page consistent.
- `/portal-add-screen`: add a new screen, wired into the tour and checks.
- `/portal-ship`: check, commit and publish.
