# unwrapped: Spotify listening stats

Web prototype, built mobile-first as the base for a future iOS app. Drop in the
data export Spotify emails you (the zip as-is, or the `.json` files inside it)
and get a stats dashboard. Everything runs client-side. No server, no upload,
single `index.html` with zero dependencies (zip extraction uses the browser's
native `DecompressionStream`).

## Features

- Hero totals, streams, artists, tracks, active days, skip rate, podcast time
- Listening personality: classifies you as one of seven archetypes (Devotee,
  Explorer, Night Owl, Weekender, Nine to Fiver, Podcast Person, All-Rounder)
  from your real patterns
- How you listen: fresh finds vs comfort loops, shuffle share, after-dark and
  early-hours shares
- Listening over time, listening clock, day of week, top artists and tracks,
  platforms, stat lines
- Year filter chips (All time plus each year in your data)
- Light and dark mode: tap the "unwrapped." title to switch, saved locally,
  follows the system until you choose
- Step-by-step in-app guide for requesting your data from Spotify, with iPhone
  specifics (safe areas and touch targets are iOS-ready)
- **The deep end**: 101 statistics dealt at random from a vault of about 490
  generators, sorted normal to weird. It opens with respectable charts and ends
  with "streams on days ending in y (100%)". Two dozen visual forms: alphabet
  charts, 7x24 heatmaps, calendar years, 24-hour clock dials, waffles,
  sparklines, versus bars, stacked shares, timelines, word clouds, dual
  columns, barcodes, podiums, meters, tiles, big numbers, one-line sentences.
  About forty interactive cards: sliders, guess-then-reveal, rerolls, and
  type-an-artist lookups (head to head, their clock, their devices, the skip
  file, the loyalty check, how long since). Every card has a corner button
  that swaps it for an unused stat of the same size; a floating Shuffle
  redeals the lot from wherever you are. Cards hide themselves when the
  export lacks the field they need, so an account-data file still deals a
  full 101. Cards render progressively so scrolling stays smooth.
- A six-step guide to requesting the export from Spotify, with the exact taps
  in the app, the wait times, and where the zip lands on each device.

## Run it

Any static server works:

```sh
python3 -m http.server 8897 -d .
# open http://localhost:8897
```

(There is also a `spotify-summary` entry in `sitejournal-ios/.claude/launch.json`
for the Claude Code browser pane.)

## What it accepts

- `my_spotify_data.zip`: either package, exactly as downloaded
- **Extended streaming history**: `Streaming_History_Audio_*.json` (lifetime; has
  platform, skip, and podcast fields, so it is preferred when present)
- **Account data**: `StreamingHistory_music_*.json` (last year; basic fields)
- Multiple files at once; non-history JSONs in the export are ignored

## Sample data

Two options:

1. **Sample listeners** built into the app. Six personas, each with five years of
   generated history shaped to a personality: The Devotee (one artist forever),
   The Night Owl, The Explorer (hundreds of artists, high skip rate), The Nine to
   Fiver (commute peaks plus morning podcasts), The Weekender, and The Podcast
   Person. Click one on the landing page.
2. `my_spotify_data.zip` in the repo root: a generated fake export with the real
   file structure, for testing the upload path. Regenerate with
   `python3 sample/make_sample.py`.

## Checking the deep end

`tools/deep-end-check.js` renders every stat in the vault for all six personas,
the sample zip, and an account-data-only slice of it, and reports errors, empty
cards, em dashes, emojis, NaN, overflow, and slow renders. It also exercises the
deal, the swap button, three redeals, the floating shuffle, and phone width.
`tools/deep-end-gallery.js` screenshots one batch so you can eyeball it. Both
need Node and a Playwright install with Chromium (`npm i -g playwright && npx
playwright install chromium`); there is still no package.json.

```sh
node tools/deep-end-check.js --persona all
node tools/deep-end-gallery.js --persona devotee --only calendar --out /tmp/shots
```

## Ideas for next steps

- Date-range filter beyond the year chips
- A shareable summary card, generated on device
- Wrap it in Capacitor for an iOS app (same shell as sitejournal-ios)
