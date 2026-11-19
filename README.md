# Vice City Cover Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/lycann666/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/lycann666/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns your own photos + a caption into GTA-style poster cover art, exported as PNG to share. Built for the [gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) on [make.fun](https://make.fun/?ref=5f3j6jyb&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01).

## How it works

1. **Add your photos** — pick files from your machine (FileReader only; photos never leave your device), or try the two built-in samples.
2. **Pick a layout** — Hero + side panels, four-panel grid, or full-bleed photo.
3. **Pick a colour grade** — Vice Sunset, Neon Night, Miami Pop, or Noir Gold.
4. **Write the caption** — accent word (script lettering), bold caption, and sub-caption, all live in the preview.
5. **Adjust each panel** — choose which photo fills it, zoom, and shift it left/right and up/down.
6. **Export PNG** — 1080×1080, 1080×1350, or 1920×1080 in one click.

## Run it

No build step, no network needed. Open `app/index.html` in desktop Chrome, or serve it locally:

```sh
node serve.ts
# then open http://localhost:8080
```

## Files

- `app/index.html`, `app/style.css`, `app/src/main.js` — the editor
- `app/src/cover.js` — the poster drawing (layouts, grades, lettering)
- `app/src/shots.js` — fixed screenshot scenes (`?shot=cover` / `?shot=editor`)
- `app/fonts/` — Anton + Pacifico, SIL Open Font License (see `app/fonts/OFL.txt`)
- `app/samples/` — two sample photos made for make.fun

## Originality

Fan-made poster tool. No Rockstar Games logo, wordmark, official artwork, character, or game font is used. All lettering uses OFL-licensed fonts bundled under `app/fonts/`.

## License

MIT — see [LICENSE](LICENSE).
