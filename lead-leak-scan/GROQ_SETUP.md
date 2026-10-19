# Groq API Integration - Setup Guide

Your Groq API key is ready. Here's how to activate AI visibility checks.

## Step 1: No Installation Needed!

Good news - we use Groq's REST API directly. **No npm packages required!**

Just verify your .env file is set up (next step).

## Step 2: Verify .env File

Check that `.env` file exists in lead-leak-scan folder with:

```
GROQ_API_KEY=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
```

(You can check with: `cat .env`)

## Step 3: Restart Dev Server

Stop the current server (Ctrl+C) and start fresh:

```bash
npm run dev
```

You should see:
```
✓ Loaded .env file
✓ GROQ_API_KEY found
```

## Step 4: Test It

Go to **http://localhost:3000** and:

1. Fill the form:
   ```
   Business: Sydney Insurance Solutions
   Website: https://example.com
   City: Sydney
   Email: test@test.com
   ```

2. Click "Get Free Scan"

3. **Wait 5-10 seconds** (Groq is querying)

4. Results page will show:
   - **AI Visibility check** now auto-detected by Groq!
   - Real answer: whether your business appears in ChatGPT

## What Groq Does

When you submit:
1. Backend fetches your website HTML
2. Detects pixels and forms (free)
3. **Queries Groq:** "Is this business mentioned for this service in this city?" (free!)
4. Gets back: "Yes" or "No"
5. Returns score based on result

## How Much This Costs

- **Groq API:** Free tier is very generous
- **Estimate:** ~1 cent per query (but free tier covers MVP)
- **Monthly:** 0-$5 if you scale massively

## Troubleshooting

**"GROQ_API_KEY not found"**
- Check `.env` file exists
- Check key is correct
- Restart server

**"Groq API error"**
- Check your internet connection
- Verify API key is valid at console.groq.com
- Try again (might be rate limit)

**"Takes too long"**
- Groq responses typically take 2-5 seconds
- First request might be slower (cold start)

## ⚠️ Security Note

Your API key is now in the `.env` file. When you deploy to Vercel:

1. **Do NOT commit .env** (already in .gitignore)
2. **Add to Vercel:** Settings → Environment Variables
3. **Add:** `GROQ_API_KEY` with your key value
4. **Deploy**

## Next Steps

Once working locally:
1. Test a few scans
2. Commit changes to GitHub
3. Deploy to Vercel (add env vars there)
4. Go live at scan.riyadesk.com

---

**You're all set! Start your dev server and test it.**
