# Vice City Cover Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/lycann666/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/lycann666/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A neon Vice City studio that turns **your photo + a caption** into GTA-style
multi-panel poster art — and exports it as a PNG to share. Static files only,
works offline in desktop Chrome, nothing is uploaded.

## What it does

- **Any photo** — load photos from your machine, or use the two free sample
  photos. Fill several panels with one photo, or give each panel its own photo.
- **Crop + position each panel** — zoom and pan sliders per panel; click a
  panel (on the preview or in the panel tabs) to edit it.
- **Four layouts** — four-panel grid, hero panel + three small panels,
  full-bleed single photo, tilted snapshot arrangement.
- **Four colour grades** — Vice City sunset, neon nights, palm noir, pastel Vice.
- **Drawn motifs, made by the app** — a retro slatted sun, palm-tree
  silhouettes, a city skyline, and a halftone title block. Bold display
  lettering (Anton) for the title, a script subtitle (Pacifico).
- **One-click PNG export** — 1080 × 1080, 1080 × 1350, and 1920 × 1080.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

1. Load a photo (or tap a sample).
2. Pick a layout and a colour grade.
3. Click a panel, zoom and pan it into place.
4. Edit the title and subtitle.
5. Export a PNG in your post size.

## Originality

No Rockstar Games logos, artwork, characters, or fonts. The only fonts are
**Anton** and **Pacifico** (SIL Open Font License, files under `app/fonts/`
with `OFL.txt`). The sun, palms, skyline and halftone are drawn by the app's
own canvas code in `app/src/cover.js`. The sample photos under `app/samples/`
were made for make.fun with an image model and are free to use.

## Files

- `app/index.html` — the editor page
- `app/style.css` — neon Vice City editor styling
- `app/src/cover.js` — the drawing engine (layouts, grades, motifs, title block)
- `app/src/main.js` — editor wiring, crop, export
- `app/src/shots.js` — fixed screenshot scenes (`?shot=cover` / `?shot=editor`)
- `app/fonts/` — Anton + Pacifico (OFL)
- `app/samples/` — two free sample photos
- `main.ts` — hands the app in: copies `app/` + `screenshots/` to `/output`
  and writes `/output/dossier.json`
- `screenshots/` — 3 screenshots taken from the app itself

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.

---

Built for the [gta6-cover-art-01 bounty on make.fun](https://make.fun/bounty/gta6-cover-art-01). Referral: https://make.fun/r/5f3j6jyb
