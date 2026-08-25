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
```

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

## ⚠️ Before you publish — swap these

I inferred these; confirm them in `index.html`:

| Where | Current value | Note |
|---|---|---|
| Footer + primary CTA | `jk.krepjak@gmail.com` | Your personal address — swap for a business one if you'd rather |
| Footer Instagram | `instagram.com/kubakrepelka` | Inferred from a local IG export folder — **verify** |
| Footer Facebook | `facebook.com/kubakrepelka` | **Guessed** — almost certainly needs changing |

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
src/style.css      design system + all sections
scripts/build-media.mjs   ffmpeg pipeline
```

Fonts: Archivo (variable, `wdth` axis for condensed display) + JetBrains Mono,
both with `latin-ext` for Czech diacritics.
