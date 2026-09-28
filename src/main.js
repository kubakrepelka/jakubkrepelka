/* ═══════════════════════════════════════════════════════════════
   Jakub Křepelka — scroll engine
   Lenis smooth scroll · GSAP ScrollTrigger · canvas frame scrub
   ═══════════════════════════════════════════════════════════════ */

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { initChrome } from './chrome.js';

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 144;                       // hero orbit frames — keep in sync with scripts/build-media.mjs
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const NARROW  = window.matchMedia('(max-width: 48rem)').matches;

/* A phone shows the hero in a portrait window, where `cover` throws away about
   three quarters of a 16:9 frame before drawing it. Decoding all of that costs
   the same as decoding the part you can see, and 320 MB of decoded frames is
   far past anything a phone keeps cached — so every frame the scrub lands on
   is decoded again, mid-scroll. There is a set cut to portrait at build time;
   half the pixels, and more real detail, because it is cropped out of the
   master's native height instead of upscaled from a downscaled one.
   Tablets and landscape phones stay on the landscape set — the crop is only
   right for a tall window. */
const PORTRAIT = window.matchMedia('(max-width: 48rem) and (max-aspect-ratio: 3/5)').matches;
const framePath = i =>
  `/frames/${PORTRAIT ? 'hero-portrait' : 'hero'}/${String(i + 1).padStart(4, '0')}.jpg`;

/* phones take every second frame — half the payload, and the shorter scroll
   range means the orbit still advances well under 3 frames per repaint */
const SHOTS = [];
for (let i = 0; i < FRAME_COUNT; i += NARROW ? 2 : 1) SHOTS.push(i);
const LAST = SHOTS.length - 1;

/* hero mark entry: how far the glyphs stretch along their travel, and how far
   the tail of a word drags behind its leading edge. Both are dialled back on a
   phone, where every pixel they take is a pixel of travel they cost. */
const SMEAR = NARROW ? 1.06 : 1.12;
const LAG   = NARROW ? 0.07 : 0.14;

/* ── smooth scroll ──────────────────────────────────────────── */
const lenis = new Lenis({
  lerp: 0.13,                 // higher = catches up to the wheel sooner
  wheelMultiplier: 1.3,
  touchMultiplier: 1.9,
  smoothWheel: true,
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
/* keep Lenis' cached metrics in step with ScrollTrigger's, or a refresh
   (resize, font swap, late media) restores a stale scroll position */
ScrollTrigger.addEventListener('refresh', () => lenis.resize());

/* anchor links routed through Lenis — the nav is shared with the other
   pages, so its hrefs are absolute (`/#build`) and have to be matched
   against this page before they count as in-page jumps */
const scrollToId = id => lenis.scrollTo(id, { duration: 1, easing: t => 1 - Math.pow(1 - t, 4) });

document.addEventListener('click', e => {
  const a = e.target.closest('[data-link]');
  if (!a) return;
  const url = new URL(a.getAttribute('href'), location.href);
  if (url.pathname !== location.pathname || !url.hash) return;   // a real navigation
  if (!document.querySelector(url.hash)) return;
  e.preventDefault();
  scrollToId(url.hash);
});

/* ═══ 1 · HERO — 360° orbit scrubbed onto a canvas ══════════════ */
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const punch = document.getElementById('heroPunch');
const pctx = punch.getContext('2d', { alpha: false });
const frames = [];
let loaded = 0;
let currentFrame = -1;
const state = { frame: 0 };

function resizeCanvas() {
  /* the portrait frames are 562px wide, so a 780px backing store would spend
     raster and commit time resolving detail the source does not carry */
  const dpr = Math.min(window.devicePixelRatio || 1, PORTRAIT ? 1.5 : 2);
  const { clientWidth: w, clientHeight: h } = canvas;
  for (const c of [canvas, punch]) {
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
  }
  currentFrame = -1;               // force a redraw at the new size
  paint();
}

/* object-fit: cover, done by hand — painted to both the base and punch layers */
function draw(img) {
  const cw = canvas.width, ch = canvas.height;
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = cw / ch;
  let dw, dh, dx, dy;
  if (cr > ir) { dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2; }
  else { dh = ch; dw = ch * ir; dy = 0; dx = (cw - dw) / 2; }
  for (const c of [ctx, pctx]) {
    c.fillStyle = '#000';
    c.fillRect(0, 0, cw, ch);
    c.drawImage(img, dx, dy, dw, dh);
  }
}

/* one paint per animation frame, only when the index actually moved */
function paint() {
  const i = Math.min(LAST, Math.max(0, Math.round(state.frame)));
  if (i === currentFrame) return;
  const img = frames[i];
  if (!img || !img.complete || !img.naturalWidth) return;
  currentFrame = i;
  draw(img);
}
gsap.ticker.add(paint);

/* ── preload ────────────────────────────────────────────────── */
const fill = document.getElementById('loaderFill');
const pct = document.getElementById('loaderPct');

function preload() {
  return new Promise(resolve => {
    const total = SHOTS.length;
    const done = () => {
      loaded++;
      const p = Math.round((loaded / total) * 100);
      gsap.to(fill, { width: `${p}%`, duration: .5, ease: 'power2.out', overwrite: true });
      pct.textContent = String(p);
      if (loaded === total) resolve();
    };
    SHOTS.forEach((src, k) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = done;
      img.onerror = done;                    // never let one bad frame stall the gate
      img.src = framePath(src);
      frames[k] = img;
    });
  });
}

/* ═══ 2 · kinetic type ══════════════════════════════════════════ */
/* split a line into per-character shells, remembering which way its half of
   the mark comes in from — JK from the left, WEBY from the right — so the two
   travel toward each other and lock together over the subject.

   Travel is measured off the viewport rather than the type, and stops short of
   the edges: at rest the halves sit apart on their own sides of the frame
   instead of off-screen, so the page still reads as a poster before anyone
   scrolls. Trailing glyphs start a touch further out, so each word stretches on
   the way in and compresses as it lands. */
function splitChars(el) {
  const dir = el.dataset.from === 'right' ? 1 : -1;
  const text = el.textContent.trim();
  const chars = Array.from(text);
  const fs = parseFloat(getComputedStyle(el).fontSize) || 120;
  const entry = markEntry(el, fs);
  el.textContent = '';
  const n = chars.length;
  return chars.map((c, i) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = c === ' ' ? ' ' : c;
    /* 0 at the leading edge of this word's travel, 1 at its tail: the leading
       glyph starts nearest its locked spot, the tail furthest out, so the word
       stretches on the way in and compresses as it lands */
    const tail = dir < 0 ? (n - 1 - i) / Math.max(1, n - 1) : i / Math.max(1, n - 1);
    span._x0 = dir * (entry.x + tail * fs * LAG);
    span._y0 = dir * entry.y;
    el.appendChild(span);
    return span;
  });
}

/* where a half sits before the scroll starts.

   The lateral travel is capped by whatever room is left beside the locked mark,
   gutter included: a half sliced by the frame edge reads as a bug, not as a
   word waiting to arrive. On a phone that room is nearly nothing — the mark
   already takes most of the width — which is what the vertical component is
   for. There the two halves come together mostly down the long axis instead,
   and the entry stays a diagonal either way. */
function markEntry(el, fs) {
  const type = el.closest('.hero__type');
  const gut = (type && parseFloat(getComputedStyle(type).paddingLeft)) || 24;
  /* the smear widens the line too, so the room is measured against the
     stretched width, not the resting one */
  const room = (window.innerWidth - el.getBoundingClientRect().width * SMEAR) / 2
             - gut - fs * LAG;
  return {
    x: Math.max(0, Math.min(window.innerWidth * 0.28, room)),
    y: window.innerHeight * (NARROW ? 0.085 : 0.03),
  };
}

function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  return words.map((w, i) => {
    const shell = document.createElement('span');
    shell.className = 'word';
    const inner = document.createElement('i');
    inner.textContent = w;
    shell.appendChild(inner);
    el.appendChild(shell);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    return inner;
  });
}

/* headlines are torn into per-word shells for the mask reveal, so a
   language switch has to rebuild them: kill the old trigger, re-split the
   fresh text, hand it a new one. Sections already scrolled past re-fire
   immediately, which reads as the headline landing again */
const splitTriggers = new WeakMap();

function initSplitWords(el) {
  splitTriggers.get(el)?.kill();
  const words = splitWords(el);
  gsap.set(words, { yPercent: 115 });
  const tw = gsap.to(words, {
    yPercent: 0,
    ease: 'power3.out',
    duration: .72,
    stagger: .045,
    scrollTrigger: { trigger: el.closest('.chapter') || el, start: 'top 55%', once: true },
  });
  splitTriggers.set(el, tw.scrollTrigger);
}

/* what a stat reads once its animation has landed — also what a language
   switch has to repaint, since the unit is part of the string */
function statFinal(val) {
  const text = val.dataset.count ? val.dataset.count + (val.dataset.suffix || '') : val.dataset.scramble;
  val.querySelector('.stat__final').textContent = text;
  val.querySelector('.stat__visual').textContent = text;
}

/* ═══ 3 · build the timelines ═══════════════════════════════════ */
function buildScene() {
  /* ── hero: orbit + mark ───────────────────────────────────── */
  const heroHalves = [...document.querySelectorAll('.hero__line')].map(el => ({
    chars: splitChars(el),
    dir: el.dataset.from === 'right' ? 1 : -1,
  }));
  const heroChars = heroHalves.flatMap(h => h.chars);
  const heroByline = document.getElementById('heroByline');
  const heroSub = document.querySelector('#heroSub span');
  const cue = document.getElementById('heroCue');
  const degOut = document.getElementById('orbitDeg');

  /* Blur is the one property here that cannot ride the compositor: animating it
     re-rasterises all six glyphs every frame, on top of a hero canvas that is
     already repainting. Desktops absorb that; phones do not, and it is the
     entry animation — the first thing anyone sees — that stutters for it. So
     phones do the same move on transform and opacity alone, and lean on a
     lower resting opacity to read as unresolved instead. */
  const ghost = NARROW
    ? { opacity: .34 }
    // no punch layer on phones either, so elsewhere the ghost sits against a
    // black void rather than a lit subject and can afford to be fainter still
    : { opacity: .26, filter: 'blur(9px)' };

  gsap.set(heroChars, {
    x: (i, el) => el._x0,
    y: (i, el) => el._y0,
    /* stretched along the direction of travel — reads as speed, and it
       squares up as the halves settle */
    scaleX: SMEAR,
    ...ghost,
  });
  gsap.set(heroByline, { y: 18, opacity: 0 });   /* hairlines and word together */
  gsap.set(heroSub, { yPercent: 0, opacity: .55 });

  const hero = gsap.timeline({
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    },
  });

  /* the money shot: scroll position → orbit angle, dead linear */
  hero.to(state, {
    frame: LAST,
    ease: 'none',
    duration: 1,
    onUpdate: () => {
      if (degOut) {
        const d = Math.round((state.frame / LAST) * 360);
        degOut.textContent = String(d).padStart(3, '0');
      }
    },
  }, 0);

  /* the two halves close on each other across the first third and lock.

     One tween per half, because the stagger has to run along each word's own
     direction of travel: the glyph at its leading edge settles first and the
     rest drag in behind it. Staggering the six glyphs as one list instead pairs
     them by distance from the middle of the list — which falls inside WEBY, not
     between the words — so W and E would set off together and arrive glued. */
  heroHalves.forEach(({ chars, dir }) => {
    hero.to(chars, {
      x: 0,
      y: 0,
      scaleX: 1,
      opacity: 1,
      ...(NARROW ? {} : { filter: 'blur(0px)' }),
      ease: 'power3.out',
      duration: .30,
      stagger: { each: .014, from: dir < 0 ? 'end' : 'start' },
    }, .04);
  });

  /* and only once they have — the byline signs the finished mark, so it
     can't arrive before there is a mark to sign */
  hero.to(heroByline, { y: 0, opacity: 1, ease: 'power2.out', duration: .09 }, .34);
  hero.to(heroSub, { opacity: 1, ease: 'power2.out', duration: .10 }, .40);

  /* and lets go again before the stats take over */
  hero.to('.hero__type, .hero__byline', { opacity: 0, y: -60, ease: 'power2.in', duration: .12 }, .86);

  /* scroll cue retires once you've engaged */
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: '8% top',
    onUpdate: self => { if (cue) cue.style.opacity = String(1 - self.progress); },
  });

  /* ── stats: count-ups + scrambles ─────────────────────────── */
  document.querySelectorAll('[data-stat]').forEach(stat => {
    const val = stat.querySelector('.stat__val');
    ScrollTrigger.create({
      trigger: stat,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        stat.classList.add('is-in');
        gsap.from(stat, { y: 34, opacity: 0, duration: .6, ease: 'power3.out' });

        if (val.dataset.count) {
          const target = Number(val.dataset.count);
          const o = { n: 0 };
          gsap.to(o, {
            n: target,
            duration: 1.05,
            ease: 'power2.out',
            /* the suffix is read live — a language switch mid-count lands
               on the next tick rather than freezing the old unit */
            onUpdate: () => {
              val.querySelector('.stat__visual').textContent = Math.round(o.n) + (o.n >= target ? (val.dataset.suffix || '') : '');
            },
            onComplete: () => { stat.dataset.done = '1'; statFinal(val); },
          });
        } else if (val.dataset.scramble) {
          scramble(val, () => { stat.dataset.done = '1'; });
        }
      },
    });
  });

  /* ── marquees ─────────────────────────────────────────────── */
  document.querySelectorAll('[data-marquee]').forEach(m => {
    const track = m.querySelector('.marquee__track');
    track.innerHTML += track.innerHTML;                 // seamless wrap
    const dir = Number(m.dataset.dir || 1);
    gsap.set(track, { xPercent: dir > 0 ? 0 : -50 });
    const tween = gsap.to(track, {
      xPercent: dir > 0 ? -50 : 0,
      duration: 26,
      ease: 'none',
      repeat: -1,
      paused: true,               // the trigger below starts it on first sight
    });
    /* scroll velocity nudges the belt — one reusable setter rather than a
       fresh tween allocated on every scroll event. The belt only runs while
       it is on screen; most of the page's height it is not. */
    const rate = { v: 1 };
    const speed = gsap.quickTo(rate, 'v', { duration: .4, onUpdate: () => tween.timeScale(rate.v) });
    ScrollTrigger.create({
      trigger: m,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: self => (self.isActive ? tween.play() : tween.pause()),
      onUpdate: self => {
        const v = gsap.utils.clamp(-4, 4, self.getVelocity() / 340);
        speed(1 + Math.abs(v));
      },
    });
  });

  /* ── chapter headings ─────────────────────────────────────── */
  document.querySelectorAll('[data-split-words]').forEach(initSplitWords);

  /* ── ZAMĚŘENÍ: one item at a time, scrubbed ───────────────── */
  const buildItems = document.querySelectorAll('.build__item');
  gsap.set(buildItems, { yPercent: 60, opacity: 0 });
  gsap.timeline({
    scrollTrigger: { trigger: '.chapter--build', start: 'top top', end: 'bottom bottom', scrub: .3 },
  })
    .to(buildItems, {
      yPercent: 0,
      opacity: 1,
      ease: 'power2.out',
      duration: .15,
      stagger: .14,
    }, .08);

  /* ── POSTUP: six steps, same treatment ────────────────────── */
  const flowItems = document.querySelectorAll('.flow__item');
  gsap.set(flowItems, { yPercent: 45, opacity: 0 });
  gsap.timeline({
    scrollTrigger: { trigger: '.chapter--process', start: 'top top', end: 'bottom bottom', scrub: .3 },
  })
    .to(flowItems, {
      yPercent: 0,
      opacity: 1,
      ease: 'power2.out',
      duration: .13,
      stagger: .095,
    }, .08);

  /* ── FINALE ───────────────────────────────────────────────── */
  gsap.from('.finale__ctas, .footer', {
    y: 40,
    opacity: 0,
    duration: .7,
    stagger: .08,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.chapter--finale', start: 'top 35%', once: true },
  });

  /* ── background clips: slow push, and only decode when visible ─ */
  /* the markup says preload="none": the three clips are ~3 MB, and fetched
     alongside the frames they sat on the loader's critical path. The frames
     are in by the time this runs, so the buffering starts now — well before
     anyone has scrolled the 300vh of hero that precedes the first clip */
  document.querySelectorAll('[data-vid]').forEach(v => {
    const chapter = v.closest('.chapter');
    v.preload = 'auto';
    v.load();
    gsap.fromTo(v,
      { scale: 1.16, yPercent: -3 },
      {
        scale: 1, yPercent: 3, ease: 'none',
        scrollTrigger: { trigger: chapter, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    ScrollTrigger.create({
      trigger: chapter,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: self => {
        if (self.isActive) v.play().catch(() => {});
        else v.pause();
      },
    });
  });

  /* ── language switch: rebuild whatever JS took apart ──────── */
  document.addEventListener('langchange', () => {
    document.querySelectorAll('[data-split-words]').forEach(initSplitWords);
    document.querySelectorAll('[data-stat]').forEach(stat => {
      const val = stat.querySelector('.stat__val');
      if (stat.dataset.done) statFinal(val);
      else if (val.dataset.scramble) val.querySelector('.stat__visual').textContent = val.dataset.scramble;
    });
    ScrollTrigger.refresh();
  });

  ScrollTrigger.refresh();
}

/* ── glyph scramble for the non-numeric stats ───────────────── */
/* the target is re-read every tick, so a language switch landing mid-scramble
   resolves to the new string instead of finishing on the old one */
function scramble(el, done) {
  const visual = el.querySelector('.stat__visual');
  const pool = '▚▞ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/∞◆';
  let tick = 0;
  const total = 22;
  const id = setInterval(() => {
    tick++;
    const final = el.dataset.scramble || '';
    const chars = Array.from(final);
    visual.textContent = chars
      .map((c, i) => (tick / total) * chars.length > i ? c : pool[(Math.random() * pool.length) | 0])
      .join('');
    if (tick >= total) { clearInterval(id); visual.textContent = final; done?.(); }
  }, 26);
}

/* dev handles — used by the scroll/perf harness, harmless in prod */
if (import.meta.env?.DEV) Object.assign(window, { __lenis: lenis, __st: ScrollTrigger, __state: state });

/* ═══ 4 · boot ══════════════════════════════════════════════════ */
/* chrome first — everything downstream splits, counts or measures the
   text it produces. The cookie bar waits for the loader to clear */
const { cookies } = initChrome({ deferCookies: true });

// Enhance the existing final HTML value; animate only the decorative copy.
document.querySelectorAll('.stat__val').forEach(val => {
  const visual = document.createElement('span');
  visual.className = 'stat__visual';
  visual.setAttribute('aria-hidden', 'true');
  visual.textContent = val.dataset.count ? '0' : val.dataset.scramble;
  val.append(visual);
  val.classList.add('stat--animated');
});

const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
/* a phone fires resize every time its URL bar slides in or out — mid-scroll,
   on the page's heaviest section. The sticky frames are sized in svh, so a
   height-only change moves nothing there; only a width change (rotation,
   split view) is worth a full re-measure. ScrollTrigger's own listener gets
   the same rule. */
ScrollTrigger.config({ ignoreMobileResize: true });
const COARSE = window.matchMedia('(pointer: coarse)').matches;
let lastWidth = window.innerWidth;
window.addEventListener('resize', debounce(() => {
  if (COARSE && window.innerWidth === lastWidth) return;
  lastWidth = window.innerWidth;
  resizeCanvas();
  lenis.resize();
  ScrollTrigger.refresh();
}, 180));

lenis.stop();
resizeCanvas();

preload().then(() => {
  currentFrame = -1;
  paint();

  const loader = document.getElementById('loader');
  const tl = gsap.timeline({
    onComplete: () => {
      loader.remove();
      lenis.start();
      ScrollTrigger.refresh();
      /* arrived from another page with a hash — the browser's own jump was undone
         by the loader gate, so make it again now the page is measurable */
      if (location.hash && document.querySelector(location.hash)) {
        lenis.scrollTo(location.hash, { immediate: true });
      }
      cookies.maybeOpen();                 // never over the loader
    },
  });
  tl.to('.loader__inner', { opacity: 0, y: -20, duration: .5, ease: 'power2.in' })
    .to(loader, { opacity: 0, duration: .7, ease: 'power2.inOut' }, '-=.15');

  buildScene();

  if (REDUCED) {
    gsap.globalTimeline.timeScale(1e6);
  }
});
