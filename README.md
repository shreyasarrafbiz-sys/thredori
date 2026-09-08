# Thredori — polish batch (placeholders, polaroid frame, plane animation, thread fix)

## 1. Placeholders removed
`data/brands.js` — emptied. The feed now shows only real posts. **This
does not touch or delete any real posts people have uploaded** — it
only removes the old sample data (Alonge, Baaya Design, etc.) that was
mixed in as filler.

## 2. Polaroid-style photo frame
`components/BrandCard.js` — every real photo now sits inside a white
frame with extra padding at the bottom and a subtle shadow, like an
actual Polaroid print, instead of a plain edge-to-edge image.

## 3. Pink paper plane animation
`components/PaperPlane.js` — new. A small pink paper plane flies across
the tagline text on the homepage, fades in and out, loops every 9
seconds. Respects `prefers-reduced-motion` (turns off automatically for
anyone with that accessibility setting on) — this is a real
accessibility need, not optional polish, since motion can trigger
discomfort or dizziness for some users, and it's now standard practice
to honor it.

## 4. Fixed: text-only discussion threads no longer show a blank box
This was the actual bug. Previously, `BrandCard.js` always tried to
render an image or a solid-color placeholder box — so a thread post
with no photo showed an empty/odd-looking colored block above its
text. Now: if a real post is a discussion thread (`post_type ===
'thread'`) with no photo attached, it skips the image entirely and
shows just the title and body text, followed by the same action row
(vote, comment, share, save) as every other post.

This required two small changes beyond `BrandCard.js`:
- `app/page.js` — now passes `post_type` through to each card
- `app/trending/page.js` — recreated with the same fix (it renders
  cards too, so it needed the same data field passed through)

**None of this touches your database or existing posts** — it's
purely how they're displayed.

## Upload
1. `data/brands.js` → upload into your repo's `data` folder, confirm overwrite
2. `components/BrandCard.js` and `components/PaperPlane.js` (new) → upload into `components`
3. `app/page.js` → upload into `app`, confirm overwrite
4. `app/trending/page.js` → upload into `app/trending`, confirm overwrite
5. Commit each batch — Vercel auto-redeploys
