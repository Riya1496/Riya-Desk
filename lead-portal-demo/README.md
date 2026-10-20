# Lead Portal Demo

A clickable demo of the lead portal client journey, from the agency's first visit to your website through to the Monday email. The sample client is Northline Insurance, a fictional home and auto agency, and every number is made up.

- **Live (once pushed to main):** https://riyadesk.com/lead-portal-demo/
- **Start screen:** `index.html` lists every screen in tour order. Each page has Back / All screens / Next links in the dark bar at the top.

## Screens

| Stage | Screens |
|---|---|
| Before signing up | Your website, Sign up |
| Free account | Onboarding, Free plan, Book the consult |
| After signing | Setup tracker, Overview, All channels, Search & AI, Paid lead quality, Lead inbox, Funnel, Weekly insight |
| Outside the portal | What leads see, Monday email |
| Behind the scenes | How it connects |

## Changing it with Claude Code

Open this repository in Claude Code and describe what you want in plain words. Claude reads `lead-portal-demo/CLAUDE.md`, which explains how the demo is built, how to test it and the rules it must follow.

Example prompts:

- `/portal-debug the inbox buttons do nothing on my phone`
- `/portal-change-numbers make total leads 320 and keep everything adding up`
- `/portal-add-screen a billing page showing the plan and invoices`
- `Change the brand color to navy and put "Acme Growth" instead of [Your brand]`
- `/portal-ship` (checks everything, commits and publishes)

## Running it yourself

You need Node.js 20 or newer.

```bash
cd lead-portal-demo
npm install                       # once
npx playwright install chromium   # once, for screenshots
npm run serve                     # open http://localhost:4321/
npm run check                     # quick health check
npm run shots                     # screenshots + click tests in a real browser
```

## Folder map

```
lead-portal-demo/
  index.html, website.html, ...   one file per screen
  assets/styles.css               all styles
  assets/shell.js                 demo bar, sidebar, tour order
  data/sample-data.json           the made-up numbers, and where they appear
  tools/check.mjs                 fast checks (links, pages, numbers)
  tools/screenshots.mjs           browser screenshots and click tests
  tools/serve.mjs                 local web server
  CLAUDE.md                       instructions for Claude Code
```
