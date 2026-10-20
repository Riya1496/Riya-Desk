---
name: portal-ship
description: Check, commit and publish the lead portal demo to riyadesk.com/lead-portal-demo/ via GitHub Pages.
disable-model-invocation: true
---

Publish the lead portal demo.

1. **Check everything.** `cd lead-portal-demo && npm run check && npm run shots`. If either fails, stop, explain what failed in plain words, and offer to fix it with `/portal-debug`.
2. **Review the changes.** Run `git status` and `git diff --stat`. Only files under `lead-portal-demo/` and `.claude/` should have changed, unless the user asked for other changes. Never commit `node_modules/` or `screenshots/`.
3. **Commit** with a short, clear message that says what changed for the client-facing demo.
4. **Ask the user** how to publish:
   - Push to `main`: goes live at https://riyadesk.com/lead-portal-demo/ in a few minutes.
   - Push a branch and open a pull request to review first.
5. **After a push to `main`**, wait about two minutes, then confirm the page is live by fetching https://riyadesk.com/lead-portal-demo/. Report the link. If it isn't live after five minutes, check the repo's GitHub Pages settings and Actions tab and tell the user what you see.
