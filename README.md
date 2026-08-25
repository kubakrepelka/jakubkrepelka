# Jakub Křepelka — cinematic scroll portfolio

Ink-black / emerald / cream scroll-driven portfolio. The hero is a 360° camera
orbit around Jakub, scrubbed frame-by-frame off a canvas as you scroll — the
central "3D element" is him.

## Run

```bash
npm run dev
```

Then open http://localhost:5173

```bash
npm run build     # production bundle into dist/
npm run preview   # serve the built bundle
npm run media     # regenerate frames + background clips from assets/
npm run favicon   # regenerate the JK icon set into public/
```

Five pages, each an `index.html` in its own folder and all five listed in
`vite.config.js`:

| | |
|---|---|
| `/` | the scroll film |
| `/zamereni/` | what I build, four deep-linkable sections |
| `/reference/` | placeholder carousel until there's real work |
| `/blog/` | empty until the first post; the markup for one is in an HTML comment |
| `/faq/` | eight answers, `<details>` accordion |

There is deliberately **no pricing page** — pricing is answered in the FAQ
instead.

## How the hero orbit works

`assets/01-hero-orbit.mp4` (Seedance 2.0, 1080p, 8.04s, 24fps) is sliced into
**144 JPEGs** at 1440px wide into `public/frames/hero/`. They total ~4.3 MB —
the black-void footage compresses hard.

All frames are preloaded and decoded behind the loader gate, so nothing decodes
mid-scroll. `state.frame` is then scrubbed linearly by GSAP ScrollTrigger over
the hero's 620vh, and painted once per index change via the GSAP ticker.

Measured on a 1440×900 desktop viewport:

| | |
|---|---|
| Composite cost (base + punch canvas) | **0.65 ms** — 3.9% of a 60fps frame |
| Scroll → frame mapping | **0.978 frames per 32px, zero variance** |
| Non-monotonic steps | **0** |
| Long frames (>20ms) during scrub | **0** |

### The "type behind him" trick

The name renders in normal DOM above the canvas, then the *same frame* is drawn
again into a second canvas stacked on top with `mix-blend-mode: lighten`.
Lighten keeps the letters wherever the footage is black (the void, his dark
polo) and lets his lit face, arms and emerald rim light win — so he occludes the
type without needing an alpha matte.

On phones the 16:9 frame is cropped so hard in portrait that he fills the
screen, which would bury the name completely. There the punch layer is dropped
for a scrim, the resting type is stronger, and only every 2nd frame loads
(72 frames, half the payload).

## Adjusting the frame sequence

Frame count lives in **two** places and must match:

- `scripts/build-media.mjs` → `FRAME_COUNT`
- `src/main.js` → `FRAME_COUNT`

Change both, then `npm run media`.

## Czech / English

Every visible string on both pages lives in `src/i18n.js`. The markup is
authored in Czech and carries the key that reaches back into that table:

| attribute | what it sets |
|---|---|
| `data-i18n` | `textContent` |
| `data-i18n-content` | `content=""` — meta description |
| `data-i18n-href` | `href=""` — the mailto subject lines |
| `data-i18n-label` | `aria-label=""` |
| `data-i18n-suffix` / `data-i18n-scramble` | the stat counters' unit and target |

Switching writes `<html lang>`, saves to `localStorage`, and fires a
`langchange` event on `document`. **main.js listens for it**, because two
things can't just have their text replaced:

- the chapter headlines are torn into per-word shells for the mask reveal, so
  they're re-split and given a fresh ScrollTrigger;
- a finished stat counter holds `24 h` as one string, so its unit is repainted.

First visit picks Czech unless the browser asks for English (`preferredLang()`).

## Navigation

`Domů · Zaměření · Reference · Blog · FAQ`, then the language switch and the
CTA. The bar is fixed on every page and stays a whisper: no background of its
own and **no group hover**, so it never lays a panel over the hero. Only the
item under the pointer lifts. The CTA is the one thing that's always lit.

Under 60rem the link row turns into a drop-down sheet behind a burger; the CTA
stays in the bar. CSS decides row-or-sheet, `initNav()` in `src/chrome.js` only
flips the state.

Nav hrefs are absolute, because the same markup ships on every page. On the home
page `main.js` catches same-page ones and hands them to Lenis; arriving from
elsewhere, the hash jump is re-made after the loader gate clears, since the gate
would otherwise swallow it.

## Contact popup

Every primary CTA carries `data-contact` on top of a working `mailto:` href.
`src/contact.js` intercepts the click and opens a native `<dialog>` with the
form; without JS the plain mailto still works.

There's no backend: on submit the answers are folded into a prefilled mail and
the visitor's own client sends it. **To post somewhere instead**, set `ENDPOINT`
at the top of `src/contact.js` to a form service or function URL — it'll POST
the JSON there and nothing else needs changing.

## Favicon

`npm run favicon` sets `JK` in Archivo at `wdth 70 / wght 900` — the same font,
weight and letter-spacing `.nav__mark` renders — in cream on ink, and writes the
SVG and the PNG/ICO rasters from the same outlines so they can't drift:

```
public/favicon.svg  favicon.ico (16/32/48)  favicon-96.png
      icon-192.png  icon-512.png  apple-touch-icon.png  site.webmanifest
```

A favicon can't load a webfont, so the two glyph outlines are baked into the
script. Google Fonts only serves static Archivo instances on the *named* width
stops, so they were lifted from the extra-condensed (62.5) and condensed (75)
instances and interpolated to 70 — the axis is linear between those stops, so
the result is the curve the browser draws. Layout and tile size are the
constants at the top of `scripts/build-favicon.mjs`.

## Cookies

`src/consent.js` stores `granted` / `denied` under `jk-consent`, asks once on
first visit, and can be reopened from the footer. **Nothing is measured today** —
the site loads no analytics either way. To switch measurement on, drop the
snippet into `enable()`; it runs on consent and never otherwise.

## ⚠️ Before you publish — swap these

I inferred these; confirm them in `index.html`:

| Where | Current value | Note |
|---|---|---|
| Footer + primary CTA | `jk.krepjak@gmail.com` | Your personal address — swap for a business one if you'd rather |
| Footer Instagram | `instagram.com/kubakrepelka` | Inferred from a local IG export folder — **verify** |
| Stats block | `24 h` · `0 Kč` · `14 dní` · `100 %` | Promises, not a track record — they replaced the invented project counts. Only keep the ones you can actually hold to |
| `/faq/` answers | 8 questions | Written from what the rest of the site already promises (24h reply, 2 weeks, fixed price, hosting after launch) — **read them and make sure you agree** |
| `/zamereni/` | apps + AI automation lists | The four website types are yours verbatim; the other two lists I drafted |
| `/reference/` | five empty slots | Placeholders until there's real signed-off work to show |

## Raw masters (Git LFS)

The four 1080p Seedance masters in `assets/` (~85 MB) are versioned with
**Git LFS**, not plain git. They aren't needed to run the site — only to
re-run `npm run media` — but they can't be regenerated identically, since
generation isn't deterministic.

Cloning this repo without git-lfs installed gets you 133-byte pointer files
instead of video. Install it first:

```bash
brew install git-lfs && git lfs install
```

Then `git clone` (or `git lfs pull` in an existing clone) fetches the real
files. GitHub's free tier covers this comfortably — 85 MB against a 1 GB
storage and 1 GB/month bandwidth allowance.

## Structure

```
assets/            raw 1080p clips from Higgsfield — Git LFS, not served
public/frames/hero 144 JPEG orbit frames
public/video/      builder / creator / closer background clips (~0.7–1.4 MB each)
src/main.js        Lenis + ScrollTrigger, frame scrub, kinetic type
src/chrome.js      what every page wears: i18n, nav, popup, cookie bar
src/i18n.js        every string, both languages
src/contact.js     the CTA's popup form
src/consent.js     cookie banner + the hook analytics will hang off
src/page.js        entry for /zamereni, /blog and /faq
src/reference.js   placeholder carousel (no GSAP, no Lenis)
src/style.css      design system + all sections
zamereni/  reference/  blog/  faq/
scripts/build-media.mjs     ffmpeg pipeline
scripts/build-favicon.mjs   JK mark → svg / ico / png
```

Fonts: Archivo (variable, `wdth` axis for condensed display) + JetBrains Mono,
both with `latin-ext` for Czech diacritics.
