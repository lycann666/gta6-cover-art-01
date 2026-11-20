[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/lycann666/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/lycann666/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice City Cover Maker

Turn any photo into GTA-style cover art — comic panels, a sunset or neon grade,
halftone dots, and giant outlined caption lettering. Free, offline, nothing
uploaded: your photos never leave your machine.

## What it does

- **Any photo, cover-fit:** upload one or two photos (or try the bundled
  samples), then zoom and pan each one inside its panel until the crop is right.
- **4 layouts:** Hero (one big photo), Duo (photo + accent panel), Trio (big
  photo + two panels), Grid (four comic panels).
- **3 colour grades:** Sunset, Neon Nights, Vice Pastel — each with its own
  photo wash, accent-panel gradient and caption underline.
- **Lettering:** a giant outlined Anton caption, a Pacifico script accent
  ("Vice City" by default), and the tag
  `FAN-MADE • ORIGINAL ART • NO ROCKSTAR ASSETS` on every cover.
- **Fast export:** PNG at 1080×1080, 1080×1350 or 1920×1080, straight from
  the canvas — the live preview is exactly what the PNG looks like.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

Pick a layout and grade, type a caption, drag the zoom/pan sliders, then
**Export PNG**. `?shot=cover` / `?shot=editor` set up fixed scenes for the
screenshots in `screenshots/`.

## How it is built

Plain static files, no libraries and no network requests: `app/index.html`
plus ES modules (`app/src/cover.js` renders the cover on canvas,
`app/src/main.js` wires the editor). The Anton and Pacifico fonts are bundled
under `app/fonts/` under the SIL Open Font License (see `app/fonts/OFL.txt`).
The two sample photos in `app/samples/` were made for make.fun and are free
to use. `main.ts` hands the app in with make.fun's vendored dossier library
(`vendor/makefun-app.ts`, Node standard library only, deterministic).

No Rockstar logo, official art or official fonts are used anywhere — every
cover is fan-made original art from the user's own photos.

Built for the [gta6-cover-art-01 bounty on make.fun](https://make.fun/bounty/gta6-cover-art-01). Referral: https://make.fun/r/5f3j6jyb
