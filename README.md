# Thredori — v4 (Pinterest-style hover)

One change since v3: card images now show a "Save" button on hover,
like Pinterest, instead of an always-visible heart icon.

## What changed
- `components/BrandCard.js` — hover now darkens the image slightly and
  reveals a "Save" button. The button doesn't do anything yet (no save
  functionality wired up) — this is a visual/interaction pass only.

## Upload
Only `components/BrandCard.js` changed. Upload it to your repo (GitHub
will ask to confirm the overwrite — say yes) — everything else can stay
as is.

## What's still different from Pinterest, and worth building next
- **Click a card → detail page.** Right now cards aren't clickable.
  Pinterest's biggest interaction is clicking a pin to see it bigger with
  a save/comment view. This needs a `/post/[id]` page.
- **Real "Save" functionality.** The button currently doesn't save
  anything — needs a `saved_posts` table in Supabase, tied to the logged
  in user.
- **Infinite scroll.** Not built yet — current feed shows everything at
  once.
