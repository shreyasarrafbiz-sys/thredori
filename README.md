# Thredori — v5 (detail page, real save, infinite scroll)

The three Pinterest mechanics from last time are now real:

## 1. Click-through detail page
`app/post/[id]/page.js` — clicking any real post (one someone actually
created via "+ New post") opens it full-size with the brand name, note,
category, a working Save button, and a link to visit the brand.

Seed brands (the original 8 placeholder examples) aren't clickable —
they're not real database records, so there's nothing to click through
to. This is expected, not a bug.

## 2. Real save functionality
Saving now writes to a new `saved_posts` table in Supabase. **Before
uploading this version, run this in Supabase SQL Editor:**

```sql
create table saved_posts (
  user_id uuid references auth.users not null,
  post_id uuid references posts not null,
  created_at timestamp default now(),
  primary key (user_id, post_id)
);

alter table saved_posts enable row level security;

create policy "Users manage their own saves" on saved_posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

If you skip this, clicking Save will silently fail (nothing happens,
no error shown).

The Save button works on both the feed cards and the detail page. If
you're logged out and click Save, it sends you to `/login`.

## 3. Infinite scroll
The homepage now loads 9 real posts at a time, and loads more
automatically as you scroll near the bottom. The original 8 seed brands
only appear after all real posts have loaded — they act as a tail, not
mixed into the main feed, so as you post more real content, the feed
becomes fully real over time.

## What changed
- New: `app/post/[id]/page.js`
- Changed: `components/BrandCard.js`, `app/page.js`

## Upload
1. Run the SQL above in Supabase first
2. Upload the full package to GitHub (new `post` folder inside `app`,
   replace the two changed files — GitHub will ask to confirm those two
   overwrites, say yes)
3. Vercel auto-redeploys, no new environment variables needed
