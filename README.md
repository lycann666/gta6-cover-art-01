# Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/lycann666/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/lycann666/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Cover Studio** turns your photos and a caption into GTA 6-style poster cover art — multi-panel collages with a Vice City sunset or neon colour grade, bold display lettering, and a one-click PNG export to share.

## What it does

- **Multi-panel posters** — four layouts: Hero + 3, Grid 4, Full-bleed, and Nine (3×3). Fill the panels with one photo or several.
- **Crop & position per panel** — click a panel to select it, drag the photo inside the preview to reposition it, zoom with the slider, swap the photo per panel, or fill every panel with one photo.
- **Editable caption** — a big display title (Anton) with outline and magenta offset shadow, plus a script subtitle (Pacifico) over a halftone dot strip.
- **Colour grades** — Vice Sunset, Neon Night, Palm Dusk, and Noir, applied as canvas gradient-maps over each photo, plus film grain and a vignette.
- **Original motifs, drawn in canvas** — a retro slatted sun, palm-tree silhouettes, and a lit skyline. All art is drawn by the app itself.
- **Exact export sizes** — 1080×1080, 1080×1350, and 1920×1080 PNGs, live preview, undo/redo, and two bundled sample photos to try it instantly.

## How to run

No build step, no network — just static files under `app/`:

```sh
node serve.ts
# open http://localhost:8080
```

1. Load your photos (or the Boulevard / Pier samples).
2. Pick a layout, a grade, and a motif.
3. Type your title and subtitle.
4. Click a panel, drag to crop, zoom if you like.
5. Choose an export size and hit **Export PNG**.

Photos are read on your own machine and never uploaded anywhere.

## Deterministic screenshot scenes

- `?shot=cover` — shows the exported PNG itself, full-frame.
- `?shot=editor` — shows the editor with a sample photo loaded.

Both accept `photo`, `caption`, `sub`, `layout`, `grade`, `motif`, and `size` parameters (see `shots.json`).

## Originality

No Rockstar Games logo, wordmark, official artwork, character, or font is used. The lettering is set in **Anton** and **Pacifico**, both under the SIL Open Font License and shipped in `app/fonts/` with their licence text. The sample photos under `app/samples/` were made with an image model for make.fun and are free to use.

## Files

- `app/index.html`, `app/style.css` — the page and its styling.
- `app/src/cover.js` — the poster renderer (panels, grades, motifs, lettering, export).
- `app/src/main.js` — the editor (state, undo/redo, drag-to-crop, shot scenes).
- `app/fonts/` — Anton + Pacifico (OFL).
- `app/samples/` — Boulevard and Pier sample photos.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the output directory and writes `dossier.json`.
- `screenshots/` — the cover and editor screenshots for this entry.

<sub>Entered on [make.fun](https://make.fun/?ref=5f3j6jyb&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
