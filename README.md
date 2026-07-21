# unwrapped: Spotify listening stats

Web prototype. Drop in the data export Spotify emails you (the zip as-is, or the
`.json` files inside it) and get a stats dashboard. Everything runs client-side.
No server, no upload, single `index.html` with zero dependencies (zip extraction
uses the browser's native `DecompressionStream`).

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

## Ideas for next steps

- Year selector / date-range filter
- Search any artist or track for its personal history
- Sessions view (longest sessions, average session length)
- Compare periods (this year vs last year)
- Wrap it in Capacitor for an iOS app (same shell as sitejournal-ios)
