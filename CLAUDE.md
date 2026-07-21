# spotify-summary

## What this is

"unwrapped". A listening-stats dashboard built from my own Spotify data export. Mobile first, entirely client side, one file.

## It does not talk to Spotify

This is the thing to understand before touching anything, because it inverts what you would assume from the name.

There is no Spotify API integration. No OAuth, no PKCE, no client id, no secret, no stored or refreshed token, no env vars, no server, and no `fetch` call anywhere in the file. The only two URLs in the entire codebase are the SVG namespace and a link to `spotify.com/account/privacy` in the in-app guide that tells you where to request your export.

So none of the usual Spotify problems apply here. No rate limits, no token expiry, no deprecated endpoints. Do not add an API integration or an auth flow unless I ask for one.

## Where the data comes from

Files the user drops into the page. The Spotify privacy data export, either as the `my_spotify_data.zip` straight from the download, or the loose JSON files from inside it.

Two formats are accepted, and it prefers the first when both are present:

- `Streaming_History_Audio_*.json`, the extended history. Lifetime coverage, includes platform, skip, and podcast fields.
- `StreamingHistory_music_*.json`, the account data. Last 12 months, basic fields only.

Everything else in the export, including `YourLibrary.json`, is ignored. The error message around line 554 names the exact filenames it looks for.

It does not read Discover Weekly data. That is a separate thing I have running elsewhere and it has no connection to this project.

## Commands

```
python3 -m http.server 8897 -d /Users/katsuma/Projects/spotify-summary
python3 sample/make_sample.py     # regenerate the fake export zip
```

Port 8897. The siblings are `site-journal` on 8899 and `on-fishing-reg` on 8898.

No build, no tests, no linter, no CI. There is no `package.json` and there should not be one.

It has to be served over http. Opening `index.html` via `file://` will hit stream and blob restrictions.

## Stack

Vanilla HTML, CSS, and JS in a single `index.html`, about 1,900 lines. Zero dependencies.

- Zip extraction uses the browser-native `DecompressionStream('deflate-raw')`, not JSZip. A browser without it cannot open the zip and there is no fallback.
- Charts are hand-rolled inline SVG. No charting library.
- Theme persists to `localStorage` under `unwrapped-theme`, wrapped in try/catch.

## The sample data is fake

`my_spotify_data.zip` in the repo root is generated test data, not my real listening history. `sample/make_sample.py` produces it with `random.seed(42)` and a hardcoded weighted list of real artist and track names, laid out to mirror the real export tree. It exists to exercise the zip upload path.

There are also six built-in synthetic listener personas with five years of history each, embedded directly in `index.html` and selectable from the landing page. Not fetched.

## Gotchas

- **`.gitignore` contains only `.DS_Store`.** Nothing else is excluded. If a real personal export ever lands in the repo root it gets committed. Worth fixing before that happens.
- `index.html` contains high-Unicode bytes, so `file(1)` reports it as `data` and plain `grep` treats it as binary and silently finds nothing with no error. Use `grep -a` on this file, always.

## Deploy

None. There is no Pages config, no workflow, no remote deploy. Local static server only.

The README lists wrapping it in Capacitor as a possible next step, using the same shell as `sitejournal-ios`. Not done. There is no iOS wrapper for this project.
