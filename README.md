# Thredori — v7 (profile, my posts, saved posts, delete)

## New in this version
- **`/profile` page** — new. Shows two tabs: "My posts" (everything you've
  posted) and "Saved" (everything you've hearted/saved). Accessible via
  a "Profile" link in the header when logged in.
- **Delete your own posts** — a Delete button appears on your posts, both
  in your profile grid and on the individual post detail page (only
  visible to the post's owner — other people's posts won't show it to you).
- **Unsave from your profile** — the Saved tab lets you remove things
  you've saved directly from that list.

## Required: add a DELETE policy in Supabase
Deleting currently has no database permission set up — without this,
clicking Delete will silently fail. Run this in SQL Editor:

```sql
create policy "Users can delete their own posts" on posts
  for delete using (auth.uid() = user_id);
```

## Upload
New: `app/profile/page.js`. Changed: `components/Header.js`,
`app/post/[id]/page.js`. Upload the whole package — GitHub will ask to
confirm the two changed files, say yes.

## Test
1. Run the SQL above first
2. Log in, click "Profile" in the header
3. Confirm your posts show under "My posts" and anything you've saved
   shows under "Saved"
4. Try deleting a post you own — it should disappear from the list and
   from the main feed
5. Try unsaving something — same, disappears from the Saved tab
