# Image sizing fix

## What was wrong
Every card forced its image into a fixed-height box using
`background-size: cover`, which crops photos to fit — that's why
Nishorama's portrait photo looked chopped in half. True Pinterest
masonry never crops; it lets each photo keep its own natural shape,
and the different resulting heights are what create the staggered
look.

## What changed
- `components/BrandCard.js` — real posts (ones with an uploaded photo)
  now render as an actual `<img>` at `width: 100%, height: auto`, so
  the photo displays at its true proportions, whatever they are.
  Placeholder/seed brands with no real photo still show a fixed-height
  solid color block, since there's nothing to size against.
- `app/page.js` — removed the old fixed-height array that used to be
  passed to every card; no longer needed since cards size themselves.

## Upload
1. Go to your `thredori` GitHub repo
2. Go into the `components` folder, upload `BrandCard.js`, confirm the
   overwrite
3. Go into the `app` folder, upload `page.js`, confirm the overwrite
4. Commit both, Vercel auto-redeploys

## Note
This only affects the main feed grid. If you want the individual post
detail page (`/post/[id]`) to also show the un-cropped photo instead
of its current fixed 420px crop, let me know and I'll fix that one too
— it's a similar change but in a different file.
