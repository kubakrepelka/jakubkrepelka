/* ═══════════════════════════════════════════════════════════════
   REFERENCE — placeholder carousel
   ═══════════════════════════════════════════════════════════════

   No GSAP, no Lenis: this page is a list of empty slots, and it should
   cost about that much. Scroll-snap does the carriage work, and the
   script only adds the arrows, the dots and drag-to-pan.
   ═══════════════════════════════════════════════════════════════ */

import { initChrome } from './chrome.js';

initChrome();

const track = document.getElementById('track');
const dots = document.getElementById('dots');
const slots = [...track.querySelectorAll('.slot')];

/* one slot plus the gap between them */
const step = () => {
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  return slots[0].getBoundingClientRect().width + gap;
};

const index = () => Math.round(track.scrollLeft / step());

/* where a smooth scroll is headed. Without it, two quick taps on the arrow
   both read the in-flight scrollLeft and ask for the same slot */
let pending = null;
const at = () => pending ?? index();

const goTo = i => {
  const target = Math.min(Math.max(i, 0), slots.length - 1);
  pending = target;
  track.scrollTo({ left: target * step(), behavior: 'smooth' });
  paint(target);
};

/* ── dots ────────────────────────────────────────────────────── */
slots.forEach((_, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'dot';
  b.setAttribute('aria-label', String(i + 1));
  b.addEventListener('click', () => goTo(i));
  dots.appendChild(b);
});

function paint(i) {
  [...dots.children].forEach((d, k) => {
    d.classList.toggle('is-on', k === i);
    d.setAttribute('aria-current', String(k === i));
  });
  document.querySelector('[data-car="prev"]').disabled = i <= 0;
  document.querySelector('[data-car="next"]').disabled = i >= slots.length - 1;
}

function sync() {
  const now = index();
  if (pending !== null && now === pending) pending = null;   // arrived
  paint(at());
}

/* ── arrows + keys ───────────────────────────────────────────── */
document.querySelectorAll('[data-car]').forEach(btn => {
  btn.addEventListener('click', () => goTo(at() + (btn.dataset.car === 'next' ? 1 : -1)));
});

track.addEventListener('keydown', e => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  e.preventDefault();
  goTo(at() + (e.key === 'ArrowRight' ? 1 : -1));
});

/* ── drag to pan — a mouse has no sideways scroll to offer ───── */
let down = null;
track.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch') return;                 // the OS does it better
  down = { x: e.clientX, left: track.scrollLeft, moved: false };
  track.classList.add('is-dragging');
});
track.addEventListener('pointermove', e => {
  if (!down) return;
  const dx = e.clientX - down.x;
  if (Math.abs(dx) > 3) down.moved = true;
  track.scrollLeft = down.left - dx;
});
const release = () => {
  if (!down) return;
  const moved = down.moved;
  down = null;
  track.classList.remove('is-dragging');
  if (moved) { pending = null; goTo(index()); }          // settle onto a slot
};
track.addEventListener('pointerup', release);
track.addEventListener('pointercancel', release);
track.addEventListener('pointerleave', release);

/* ── keep the UI in step ─────────────────────────────────────── */
let raf = 0;
track.addEventListener('scroll', () => {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(sync);
}, { passive: true });
window.addEventListener('resize', sync);
sync();

/* slots ease in once, on first sight */
const seen = new IntersectionObserver((entries, obs) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('is-in');
    obs.unobserve(e.target);
  }
}, { threshold: .25 });
slots.forEach(s => seen.observe(s));
