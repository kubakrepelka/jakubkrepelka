# JK WEBY — cinematic scroll portfolio

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

All frames are fetched behind the loader gate. `state.frame` is then scrubbed
linearly by GSAP ScrollTrigger over the hero's 300vh, and painted once per index
change via the GSAP ticker.

They are **not** all decoded up front, and cannot be: a decoded 1440×810 frame is
4.45 MB, so the 72 a phone loads would be 320 MB of bitmaps. The browser keeps a
small fraction of that, which means the scrub decodes the frame it lands on,
mid-scroll — which is what the portrait set below is for.

Scroll driven in 32px steps:

| | 1440×900 desktop | 390×844 phone |
|---|---|---|
| Scroll → frame mapping | 2.542 frames / 32px | 1.346 frames / 32px |
| Variance | 0 | 0 |
| Non-monotonic steps | 0 | 0 |

### Why phones get their own frames

`public/frames/hero-portrait/` is the same orbit cropped to **562×1080** at build
time (`npm run media hero-portrait`). A phone draws the hero into a portrait
window, so `cover` was throwing three quarters of each 16:9 frame away and
upscaling the sliver left over — paying full decode cost for pixels it never
showed, on every frame the scrub touched. That is what made the entry animation
stutter.

| | landscape set | portrait set |
|---|---|---|
| Pixels per frame | 1.17 M | 0.61 M |
| Decode, 4× CPU throttle | 1.75 ms | 1.05 ms |

The crop also carries *more* real detail than before, because it comes out of the
master's native 1920×1080 rather than being upscaled from a 1440-wide downscale.
With a 562px-wide source the canvas caps its backing store at 1.5× dpr, since a
2× one would only resolve detail that isn't there.

The set is picked once at load by `(max-width: 48rem) and (max-aspect-ratio: 3/5)`.
Tablets and landscape phones keep the landscape set, where that crop would be
wrong; rotating a phone after load does not re-pick it.

### The "type behind him" trick

The mark renders in normal DOM above the canvas, then the *same frame* is drawn
again into a second canvas stacked on top with `mix-blend-mode: lighten`.
Lighten keeps the letters wherever the footage is black (the void, his dark
polo) and lets his lit face, arms and emerald rim light win — so he occludes the
type without needing an alpha matte.

On phones the 16:9 frame is cropped so hard in portrait that he fills the
screen, which would bury the mark completely. There the punch layer is dropped
for a scrim, the resting type is stronger, and only every 2nd frame loads
(72 frames, half the payload). The entry animates on transform and opacity
alone there too — a blur is the one property in it that cannot ride the
compositor, and re-rasterising six full-width glyphs per frame over a canvas
that is already repainting is what a phone cannot afford.

### The mark

**JK** over **WEBY**, and the two halves start apart — JK out to the left, WEBY
out to the right — closing on each other as you scroll until they lock over the
portrait. Two glyphs over four would read as a stub above a bar, so the width
axis does the levelling rather than the size alone: JK runs at `'wdth' 118`,
WEBY at `60`, and `--mark-weby` drives both through a measured `1.273×`. Both
lines land on the same ink width, flush left and right. Below them the emerald
line carries **Jakub Křepelka** — the mark is the brand, that is the person.

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

## Kontaktní formulář (Resend)

Stávající CTA s `data-contact` otevírají český dialog v `src/contact.js`.
Vite + čistý JavaScript a vlastní CSS zůstávají zachované. Sdílená validace
je v `shared/contact.js`, Vercel endpoint v `api/contact.js` a serverové
odesílání v `server/contact.js`. Prohlížeč volá pouze `/api/contact`.

### Nastavení před nasazením

1. V Resend → Domains přidejte `mail.jkweby.cz`. U poskytovatele DNS ručně
   vložte přesně záznamy, které Resend zobrazí, a počkejte na ověření.
   Neměňte stávající MX záznamy pro příjem pošty na `jkweby.cz`.
2. Vytvořte API klíč s oprávněním Sending access pro ověřenou doménu.
3. Zkopírujte `.env.example` do `.env.local` a vyplňte klíč. Stejné hodnoty
   nastavte ve Vercel projektu `jkweby` → Settings → Environment Variables:
   - `RESEND_API_KEY`: vytvořený tajný klíč (pouze server).
   - `CONTACT_EMAIL`: `info@jkweby.cz`.
   - `CONTACT_FROM_EMAIL`: `JK WEBY <web@mail.jkweby.cz>` — ve Vercelu bez vnějších uvozovek.
     Uvozovky v `.env.example` jsou syntaxe souboru, ne součást hodnoty v dashboardu.
   - `CONTACT_SEND_CONFIRMATION`: `true` (nebo `false` pro vypnutí potvrzení).
4. Nastavte hodnoty pro Production a případně Preview, potom nasaďte nový build.
   Žádný tajný klíč nesmí mít prefix `VITE_` ani být commitovaný.

### Spam a Turnstile

Honeypot, limit velikosti, serverová validace a kontrola Origin jsou aktivní.
Základní limit je 5 validních pokusů za 10 minut na IP v jedné instanci.
Je pouze orientační: při škálování/restartu Vercelu není globální. Pro veřejný
provoz doporučujeme zapnout připravený Turnstile nebo limit na Vercel Firewallu.
Bez Turnstile může útočník zneužívat i potvrzovací e-maily; ty lze vypnout.

V Cloudflare Turnstile vytvořte widget pro `jkweby.cz` a `www.jkweby.cz`.
Nastavte společně `VITE_TURNSTILE_SITE_KEY` (veřejný) a `TURNSTILE_SECRET_KEY`
(tajný), poté rebuild. `TURNSTILE_HOSTNAMES=jkweby.cz,www.jkweby.cz` je seznam
povolených hostname; pro lokální test přidejte localhost také do widgetu i seznamu.
Server kontroluje token, hostname a action `contact`. Bez obou klíčů widget
nezapínejte. DNS se při implementaci automaticky nemění.

### Chování a testování

`formulář → /api/contact → validace a spam kontrola → Resend → e-mail`.
Návštěvník je `replyTo`, odesílatel je ověřená adresa. E-maily jsou prostý text,
takže uživatelský obsah není interpretován jako HTML. Chyby zachovávají formulář.
Resend idempotency klíče chrání opakování stejné poptávky během jeho 24h okna.
Potvrzení se posílá až po přijetí hlavní zprávy Resendem; jeho chyba se loguje
bez osobních údajů a nevrací návštěvníkovi neúspěch hlavní poptávky.
Úspěch API znamená přijetí Resendem, nikoli ověřené doručení do schránky.

- `node --test tests/contact.test.js`: serverové testy bez skutečných e-mailů.
- `npm run build`: produkční frontend.
- `npx vercel dev`: lokální frontend i Vercel API s `.env.local` (vyžaduje Vercel CLI).
  Samotné `npm run dev` spouští jen Vite, bez serverového endpointu.
- Po konfiguraci otevřete web, klikněte na CTA, vyplňte vlastní e-mail a odešlete
  jednu poptávku. Zkontrolujte hlavní schránku, potvrzení a stav Delivered v Resendu.
  Kliknutí na Odpovědět má směřovat návštěvníkovi.

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
| Footer + primary CTA | `info@jkweby.cz` | Business address — make sure the mailbox actually receives before you publish |
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

Fonts: Archivo (variable, `wdth` axis for condensed display) for the display
type, Instrument Sans for running text, Spline Sans Mono for the technical
labels — all three with `latin-ext` for Czech diacritics.
