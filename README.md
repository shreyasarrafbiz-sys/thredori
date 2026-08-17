# Thredori — v1

A Next.js web app with a Pinterest-style feed, Fashion/Home filtering, and
your locked visual identity (indigo, madder red, cotton off-white, swatch
cards).

## What's in here
- `app/page.js` — the homepage and feed
- `app/layout.js` — page shell, title, meta description
- `app/globals.css` — colors, fonts, base styles
- `components/Header.js` — top bar, search, category tabs
- `components/BrandCard.js` — the swatch card design
- `data/brands.js` — your seed content (edit this file to add/change brands)

## How to add or edit brands
Open `data/brands.js` and edit the list. Each entry needs:
`id`, `name`, `category` ("Fashion" or "Home"), `note`, `location`, `color`
(a hex fallback), and `image` (leave empty for now, or paste a real photo
URL once a brand gives permission).

## Deploy this — no command line needed

1. Go to github.com, log in, click "New repository." Name it `thredori`.
   Keep it Public. Don't initialize with a README (you already have one).
2. On the new repo page, click "uploading an existing file." Drag every
   file and folder from this package into that upload box, then commit.
3. Go to vercel.com, click "Sign up," choose "Continue with GitHub."
4. Click "Add New Project," select your `thredori` repo, click "Deploy."
   Vercel auto-detects Next.js — no settings to change.
5. In a minute or two, Vercel gives you a live URL like
   `thredori.vercel.app`. That's your app, live on the internet.
6. To connect your real domain: in the Vercel project, go to
   Settings > Domains, add `thredori.com`, then add the DNS records
   Vercel shows you into your GoDaddy domain settings.
