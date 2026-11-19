# Vice Cover — GTA 6-style cover art maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/lycann666/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/lycann666/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Entry for the [gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) ($250 pot, top 50 paid).

**Vice Cover** is an offline web app that turns your own photos into GTA 6-style poster cover art and exports it as a PNG to share. No account, no upload, no network — open `app/index.html` in desktop Chrome and it just works.

## How it works — 4 steps

1. **Add a photo** — pick Photo A and Photo B from your machine (read with FileReader; photos never leave your computer), or try the two sample photos.
2. **Pick a layout & grade** — three poster layouts (Hero + sides, Four grid, Full bleed) and three colour grades (Vice Sunset, Neon Night, Palm Day).
3. **Write the caption** — bold poster lettering plus a script sub-caption. Each panel can be filled with Photo A or B and cropped: zoom and move it until it sits right.
4. **Export PNG** — one click, in 1080×1080, 1080×1350, or 1920×1080.

The preview is live: what you see is exactly what the PNG looks like.

## Run it

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

Or open `app/index.html` directly. No build step, no dependencies.

## Files

- `app/index.html`, `app/style.css`, `app/src/*.js` — the whole app (plain static files)
- `app/fonts/` — Anton + Pacifico, OFL-licensed (see `app/fonts/OFL.txt`); no Rockstar artwork, logo, or font is used anywhere
- `app/samples/` — two sample photos made for make.fun
- `main.ts` — builds the submission (`MAKEFUN_OUTPUT_DIR=out node main.ts`)
- `screenshots/` — exported covers + the editor at work

Made with make.fun — [join with my referral](https://make.fun/?ref=5f3j6jyb&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
