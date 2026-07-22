# unwrapped: design brief

Paste this whole file as the first message to a new Claude conversation when you
want help designing a part of the app. Add one line at the top saying what you
want designed this time, for example "Design the onboarding screen" or "Design a
shareable summary card." Attach a screenshot of the current app if you have one.
Everything below is the context Claude needs to understand the project.

---

## What the app is

unwrapped is a personal-stats web app for your own Spotify listening history. You
request your data export from Spotify, drop the file in, and the app reads it in
your browser and turns it into a scrollable set of charts and stats. It is the
part of Spotify Wrapped that Wrapped never shows you, plus a long tail of stranger
stats the deeper you scroll.

It is a prototype built on the web, but the real target is an iOS app. The plan is
to wrap the same single HTML file in Capacitor later, so every design decision
should feel at home on an iPhone, not just a desktop browser.

The current version is v0.9. Versions are written v0.9, v0.10, v0.11, one number
after the dot, no second decimal.

## Who it is for and how it should feel

The user is a regular Spotify listener who is curious about their own habits and
likes the Wrapped moment but wants more of it, and weirder. The feeling is calm
and a little deadpan. The charts do the talking. The copy is dry and knows the
stats are absurd. Nothing is hyped. A good stat lands as "I did not need to know
this, but thank you." It should be easy to use with no explanation and reward
scrolling with things that catch your eye.

## How it works, and the constraints that will not change

- One file. The entire app is a single `index.html` with all CSS and JavaScript
  inline. No frameworks, no build step, no external requests. Charts are hand
  drawn as inline SVG and plain divs. Zip extraction uses the browser's native
  `DecompressionStream`, so there are no libraries at all.
- Everything runs on device. The file the user drops in is parsed in the tab and
  never uploaded anywhere. There is no server, no account, no analytics. That
  privacy is a promise the footer makes, and it is a feature, not a limitation.
- iOS ready. The layout already uses safe-area insets, 44px minimum touch
  targets, and system fonts. Anything new has to hold up in a phone-sized
  viewport and as an installed app.
- Theme aware. Light and dark are both first-class. The user switches by tapping
  the "unwrapped." title. The choice is saved locally and otherwise follows the
  system setting.

So anything Claude designs must be deliverable as self-contained HTML and CSS
(and vanilla JS if needed) that drops into this file: inline styles, no external
fonts or scripts, works in light and dark, works on a phone.

## The data it reads

Spotify gives users their data on request from spotify.com/account/privacy. Two
packages matter, and the app reads both:

- Extended streaming history. Files named `Streaming_History_Audio_*.json`.
  Covers the whole account lifetime. Each play has: `ts` (ISO timestamp with
  seconds), `ms_played`, `master_metadata_track_name`, `master_metadata_album_artist_name`,
  `master_metadata_album_album_name`, `platform`, `shuffle` (bool), `skipped`
  (bool), and podcast fields (`episode_name`, `episode_show_name`). This is the
  richer one and is preferred when present.
- Account data. Files named `StreamingHistory_music_*.json`. Covers only the last
  year. Each play has just `endTime`, `artistName`, `trackName`, `msPlayed`. No
  seconds, no skip, no shuffle, no album, no platform.

The user drops in the zip as downloaded, or the loose JSON files, or the app
generates fake data for six sample listeners so you can see it full without an
export. A play counts as a real "stream" at 30 seconds or more.

Design implication: many stats only exist when the richer export is loaded. Cards
that need skip, shuffle, seconds, album, or platform data hide themselves when the
data is not there. Any new stat should degrade the same way.

## What exists right now

The app is one long scroll in two halves. The top half is the universal dashboard.
The bottom half, called "the deep end," is where it gets strange.

Landing screen, before a file is loaded:
- Header with the "unwrapped." wordmark (the period is in the accent color) and a
  one-line tagline.
- A drop zone. Drag a file or tap "Choose file."
- A five-step guide, "How to get your file from Spotify," with the exact taps for
  the phone and where the zip lands on an iPhone.
- Six sample-listener chips: The Devotee, The Night Owl, The Explorer, The Nine to
  Fiver, The Weekender, The Podcast Person. Each generates five years of fake
  history shaped to that personality.

Dashboard, after a file loads:
- A source note and a date range pill.
- Year filter chips (All time, then one per year in the data). They recompute the
  whole page instantly.
- Hero card: total listening hours as a large number, translated into days of
  nonstop music and minutes per day, plus a "listening personality" line that
  classifies the user as one of seven archetypes (Devotee, Explorer, Night Owl,
  Weekender, Nine to Fiver, Podcast Person, All-Rounder) from their real patterns.
- A row of stat tiles: streams, different artists, different tracks, active days,
  skip rate, podcast time.
- Listening over time: an area-and-line chart, hours per month or minutes per day,
  with a hover crosshair and a data table.
- Top artists (by time) and top tracks (by plays), as ranked horizontal bars.
- Your listening clock (columns by hour of day) and day of the week (columns by
  weekday).
- How you listen: fresh finds, comfort loops, shuffle share, after dark, early
  hours, as labeled bars.
- Stat lines: a few sentence-style facts (biggest day, on repeat, headliner, day
  one, streak, after midnight).
- Where you listen: platform share, only when platform data exists.

The deep end:
- 101 stats dealt at random from a pool of about 186 generators, so each visit and
  each shuffle is a different set. It is sorted from normal at the top to weird at
  the bottom. Every generator carries a weirdness weight, and the deal is sorted by
  that weight with some jitter.
- No section header, no explanation. You just keep scrolling and stats keep coming.
- The stats span many visual forms: 26-letter alphabet bar charts, a 7 by 24
  heatmap, podiums, meters, funnels, a 60-row second-by-second chart, column
  charts, ranked lists, big single numbers, one-line sentences, and six
  interactive lookups (a word detector, a pick-a-minute tool, a pick-a-date file,
  a ransom note speller, a bedtime audit, and a "receipts for your favorite
  artist" input). A few are deliberately dumb one-bar jokes, like "streams on days
  ending in y, 100 percent."
- Tiles come in mixed widths and pack into rows that always fill exactly, with a
  uniform 14px gap everywhere. Full-width charts take their own row. Number cards
  group together. Nothing leaves a hole and no small card is stretched wide.
- At the very bottom, one button, "Shuffle again," jumps to the top and deals a
  fresh 101.

## The visual design system

Type. System sans only, the stack `system-ui, -apple-system, "Segoe UI",
sans-serif`. No display face, no serif, ever. Large standalone numbers (the hero,
stat-tile values) use normal proportional figures. Only columns of numbers that
must line up (table rows, axis ticks) use `tabular-nums`.

Color. Defined as CSS custom properties, swapped as a set between light and dark.
Use the role, never a raw hex.

Light mode:
- page background `#f9f9f7`, card surface `#fcfcfb`
- primary ink `#0b0b0b`, secondary ink `#52514e`, muted `#898781`
- hairline border `rgba(11,11,11,0.10)`, gridline `#e1e0d9`, baseline `#c3c2b7`
- accent (bars, ranking marks, the wordmark dot) `#1baf7a`, deeper accent `#0e7a54`
- trend line and area `#2a78d6`

Dark mode:
- page `#0d0d0d`, card surface `#1a1a19`
- primary ink `#ffffff`, secondary ink `#c3c2b7`, muted `#898781`
- border `rgba(255,255,255,0.10)`, gridline `#2c2c2a`, baseline `#383835`
- accent `#199e70`, deeper accent `#26c58e`, trend `#3987e5`

The palette is intentionally quiet. One green does most of the work. Text always
wears the ink colors, never the data color. A colored mark sits next to a label,
the label itself stays ink. This palette was validated for colorblind safety and
contrast, so hold new colors to the same bar or reuse the existing roles.

Cards. White (well, `--surface`) rectangles with a 1px hairline border and rounded
corners. Radius is 16px for the big cards, 14px for tiles and deep-end cards.
Padding is roughly 16 to 22px. Card titles are a small semibold `h3`, with an
optional muted one-line subtitle under it. The gap between cards is a uniform 14px.

Charts. Bars and columns are the accent green, thin, with a 4px rounded end and a
square base, capped so they never fill their whole slot. The trend line is 2px,
its area fill is the same blue at about 10 percent opacity. Gridlines are hairline
and recessive. Axes round to clean numbers. Charts get a hover tooltip. Labels are
selective, never a number on every bar.

Motion. Very little. A smooth scroll to top, gentle button press states, no
animation for its own sake.

## The writing voice

All copy follows this voice. It is the LocalThunk devlog register: someone who
knows what they are doing, talking plainly, not performing.

- Write like a person telling another person what happened. Vary sentence length.
  Lead with the actual point.
- Dry humor only when it comes out of the data. No jokes bolted onto the end. If
  you would not say it out loud, do not write it.
- Plain words over jargon. Contractions are fine. Fragments are fine when they
  land. Casual tone, real information.
- Banned: corporate voice ("excited to," "leveraging," "robust," "seamlessly"),
  hype (nothing is amazing, it just works), filler openers, exclamation points.
- No em dashes anywhere. Use a comma, a period, or restructure.
- No emojis anywhere, in copy or UI.

## Hard rules

- No em dashes and no emojis, in code comments, copy, and UI alike.
- Not affiliated with Spotify. Do not use Spotify's logo, wordmark, or green.
  unwrapped has its own name and its own quieter green.
- Privacy is absolute. Nothing the user loads leaves the device. Do not design any
  feature that uploads, phones home, or needs an account or a server.
- Genre, tempo, and mood are not in the export, and Spotify closed its audio
  features API to new apps in late 2024. So the app infers vibe from behavior, not
  from audio. Do not design anything that assumes track genre or tempo is
  available. If we ever add it, it would be an optional online lookup against a
  public database, off by default.
- Deliverables must be self-contained HTML and CSS that drop into the one file,
  work in light and dark, and work on a phone.

## What still needs designing

This is the open space. Pick one at a time.

- Onboarding and the landing screen. The first thing someone sees. Right now it is
  a drop zone plus a text guide. It could be warmer and clearer, especially the
  "how to get your file from Spotify" walkthrough on a phone.
- States. Loading while a large export parses, an error when the wrong file is
  dropped, and the empty and partial-data cases (account-data-only, which hides a
  lot of stats).
- A shareable summary. A single card or image a user could screenshot and send,
  built from their stats. Has to be generated on device.
- The deep-end experience. It works, but the entrance into it, the pacing from
  normal to weird, and the "shuffle again" moment could all be designed rather than
  just functional.
- The iOS app chrome. What the app looks like as an installed app: the icon, the
  launch screen, the status bar, how the top of the scroll meets the notch.
- Settings or a home base. Currently there is no settings surface. If we add one
  (theme, units, clear data, re-load a file), it needs a home.
- A visual identity pass. The wordmark, the one accent green, the overall feel.
  It is deliberately plain now. It could have a stronger point of view without
  getting loud.

## How to hand a design back

When you produce a design, make it a self-contained HTML artifact I can preview:
inline CSS, system fonts, the color roles above as CSS variables for light and
dark, responsive down to a 375px phone width, no external assets. Keep the copy in
the voice, with no em dashes and no emojis. If a piece needs new behavior, plain
vanilla JS is fine. Assume it will be pasted into a single-file app with no build
step.
