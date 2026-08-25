/* ═══════════════════════════════════════════════════════════════
   JAKUB KŘEPELKA — scroll engine
   Lenis smooth scroll · GSAP ScrollTrigger · canvas frame scrub
   ═══════════════════════════════════════════════════════════════ */

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { initChrome } from './chrome.js';

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 144;                       // hero orbit frames — keep in sync with scripts/build-media.mjs
const framePath = i => `/frames/hero/${String(i + 1).padStart(4, '0')}.jpg`;
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const NARROW  = window.matchMedia('(max-width: 48rem)').matches;

/* phones take every second frame — half the payload, and the shorter scroll
   range means the orbit still advances well under 3 frames per repaint */
const SHOTS = [];
for (let i = 0; i < FRAME_COUNT; i += NARROW ? 2 : 1) SHOTS.push(i);
const LAST = SHOTS.length - 1;

/* ── smooth scroll ──────────────────────────────────────────── */
const lenis = new Lenis({
  lerp: 0.085,
  wheelMultiplier: 1,
  touchMultiplier: 1.6,
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
const scrollToId = id => lenis.scrollTo(id, { duration: 1.6, easing: t => 1 - Math.pow(1 - t, 4) });

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
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
/* split a line into per-character shells, remembering how far each
   one has to travel so the whole word "tracks in" on the compositor */
function splitChars(el) {
  const text = el.textContent.trim();
  const chars = Array.from(text);
  const fs = parseFloat(getComputedStyle(el).fontSize) || 120;
  el.textContent = '';
  const n = chars.length;
  return chars.map((c, i) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = c === ' ' ? ' ' : c;
    // rest-state offset scales with the fluid display size so it never overflows
    span._spread = (i - (n - 1) / 2) * fs * 0.17;
    el.appendChild(span);
    return span;
  });
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
    duration: 1.1,
    stagger: .07,
    scrollTrigger: { trigger: el.closest('.chapter') || el, start: 'top 55%', once: true },
  });
  splitTriggers.set(el, tw.scrollTrigger);
}

/* what a stat reads once its animation has landed — also what a language
   switch has to repaint, since the unit is part of the string */
function statFinal(val) {
  if (val.dataset.count) val.textContent = val.dataset.count + (val.dataset.suffix || '');
  else if (val.dataset.scramble) val.textContent = val.dataset.scramble;
}

/* ═══ 3 · build the timelines ═══════════════════════════════════ */
function buildScene() {
  /* ── hero: orbit + name ───────────────────────────────────── */
  const heroChars = [...document.querySelectorAll('.hero__line')].flatMap(splitChars);
  const heroSub = document.querySelector('#heroSub span');
  const cue = document.getElementById('heroCue');
  const degOut = document.getElementById('orbitDeg');

  gsap.set(heroChars, {
    yPercent: 18,
    // phones have no punch layer, so the resting ghost has to hold its own
    // against a lit subject rather than a black void
    opacity: NARROW ? .55 : .28,
    x: (i, el) => el._spread,
    filter: NARROW ? 'blur(5px)' : 'blur(9px)',
  });
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

  /* name tracks in letter by letter across the first third */
  hero.to(heroChars, {
    yPercent: 0,
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    ease: 'power3.out',
    duration: .30,
    stagger: { each: .0075, from: 'start' },
  }, .04);

  hero.to(heroSub, { opacity: 1, ease: 'power2.out', duration: .10 }, .30);

  /* and lets go again before the stats take over */
  hero.to('.hero__type', { opacity: 0, y: -60, ease: 'power2.in', duration: .12 }, .86);

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
        gsap.from(stat, { y: 34, opacity: 0, duration: 1, ease: 'power3.out' });

        if (val.dataset.count) {
          const target = Number(val.dataset.count);
          const o = { n: 0 };
          gsap.to(o, {
            n: target,
            duration: 1.9,
            ease: 'power2.out',
            /* the suffix is read live — a language switch mid-count lands
               on the next tick rather than freezing the old unit */
            onUpdate: () => {
              val.textContent = Math.round(o.n) + (o.n >= target ? (val.dataset.suffix || '') : '');
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
    });
    /* scroll velocity nudges the belt */
    ScrollTrigger.create({
      onUpdate: self => {
        const v = gsap.utils.clamp(-4, 4, self.getVelocity() / 340);
        gsap.to(tween, { timeScale: 1 + Math.abs(v), duration: .4, overwrite: true });
      },
    });
  });

  /* ── chapter headings ─────────────────────────────────────── */
  document.querySelectorAll('[data-split-words]').forEach(initSplitWords);

  /* ── ZAMĚŘENÍ: one item at a time, scrubbed ───────────────── */
  const buildItems = document.querySelectorAll('.build__item');
  gsap.set(buildItems, { yPercent: 60, opacity: 0 });
  gsap.timeline({
    scrollTrigger: { trigger: '.chapter--build', start: 'top top', end: 'bottom bottom', scrub: .6 },
  })
    .to(buildItems, {
      yPercent: 0,
      opacity: 1,
      ease: 'power2.out',
      duration: .18,
      stagger: .16,
    }, .12);

  /* ── POSTUP: six steps, same treatment ────────────────────── */
  const flowItems = document.querySelectorAll('.flow__item');
  gsap.set(flowItems, { yPercent: 45, opacity: 0 });
  gsap.timeline({
    scrollTrigger: { trigger: '.chapter--process', start: 'top top', end: 'bottom bottom', scrub: .6 },
  })
    .to(flowItems, {
      yPercent: 0,
      opacity: 1,
      ease: 'power2.out',
      duration: .16,
      stagger: .11,
    }, .12);

  /* ── FINALE ───────────────────────────────────────────────── */
  gsap.from('.finale__ctas, .footer', {
    y: 40,
    opacity: 0,
    duration: 1.1,
    stagger: .12,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.chapter--finale', start: 'top 35%', once: true },
  });

  /* ── background clips: slow push, and only decode when visible ─ */
  document.querySelectorAll('[data-vid]').forEach(v => {
    const chapter = v.closest('.chapter');
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
      else if (val.dataset.scramble) val.textContent = val.dataset.scramble;
    });
    ScrollTrigger.refresh();
  });

  ScrollTrigger.refresh();
}

/* ── glyph scramble for the non-numeric stats ───────────────── */
/* the target is re-read every tick, so a language switch landing mid-scramble
   resolves to the new string instead of finishing on the old one */
function scramble(el, done) {
  const pool = '▚▞ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/∞◆';
  let tick = 0;
  const total = 34;
  const id = setInterval(() => {
    tick++;
    const final = el.dataset.scramble || '';
    const chars = Array.from(final);
    el.textContent = chars
      .map((c, i) => (tick / total) * chars.length > i ? c : pool[(Math.random() * pool.length) | 0])
      .join('');
    if (tick >= total) { clearInterval(id); el.textContent = final; done?.(); }
  }, 34);
}

/* dev handles — used by the scroll/perf harness, harmless in prod */
if (import.meta.env?.DEV) Object.assign(window, { __lenis: lenis, __st: ScrollTrigger, __state: state });

/* ═══ 4 · boot ══════════════════════════════════════════════════ */
/* chrome first — everything downstream splits, counts or measures the
   text it produces. The cookie bar waits for the loader to clear */
const { cookies } = initChrome({ deferCookies: true });

const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
window.addEventListener('resize', debounce(() => {
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
      /* arrived from /zamereni/ with a hash — the browser's own jump was undone
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
