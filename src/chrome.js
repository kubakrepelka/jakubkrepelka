/* ═══════════════════════════════════════════════════════════════
   CHROME — what every page wears
   ═══════════════════════════════════════════════════════════════
   Language, the sticky nav, the contact popup, the cookie bar and the
   footer year. One call per page; the home page holds the cookie bar
   back until its loader has finished.
   ═══════════════════════════════════════════════════════════════ */

import { initI18n } from './i18n.js';
import { initConsent } from './consent.js';
import { initContact } from './contact.js';

/* ── nav ─────────────────────────────────────────────────────── */
/* the bar itself is pure CSS — it stays quiet and never lays a panel over
   the page unasked. This owns the two things that open on request: the
   phone menu, and the four zaměření cards under the one word in the row */
function initNav() {
  const nav = document.getElementById('nav');
  const toggle = nav?.querySelector('[data-menu]');
  const panel = nav?.querySelector('.nav__links');
  if (!nav || !toggle || !panel) return;

  const setOpen = on => {
    nav.classList.toggle('is-open', on);
    toggle.setAttribute('aria-expanded', String(on));
  };

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  /* picking anything in the sheet closes it — except the zaměření word,
     which only ever opens its own cards */
  panel.addEventListener('click', e => {
    if (e.target.closest('a, button') && !e.target.closest('[data-group] button')) setOpen(false);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  document.addEventListener('click', e => {
    if (nav.classList.contains('is-open') && !nav.contains(e.target)) setOpen(false);
  });
  /* the sheet is a phone affordance — a resize past the breakpoint drops it */
  window.matchMedia('(min-width: 60rem)').addEventListener('change', e => {
    if (e.matches) setOpen(false);
  });

  initGroup(nav);
}

/* the four cards: hover opens them where there is a pointer to hover
   with, a click opens them everywhere else, and the keyboard gets the
   same button plus Escape. On phones the sheet shows them permanently
   (CSS), so none of this fires there */
function initGroup(nav) {
  const group = nav.querySelector('[data-group]');
  const btn = group?.querySelector('button');
  if (!group || !btn) return;

  const hoverable = window.matchMedia('(hover: hover)');
  const isOpen = () => group.classList.contains('is-open');
  const set = on => {
    group.classList.toggle('is-open', on);
    btn.setAttribute('aria-expanded', String(on));
  };

  /* with a mouse the cards are already open by the time the word is
     clicked, so a click there keeps them rather than snapping them shut.
     Enter and Space arrive as clicks with detail 0 — those still toggle */
  btn.addEventListener('click', e => set(hoverable.matches && e.detail > 0 ? true : !isOpen()));
  group.addEventListener('mouseenter', () => { if (hoverable.matches) set(true); });
  group.addEventListener('mouseleave', () => set(false));
  /* tabbing out the far side of the last card closes them again */
  group.addEventListener('focusout', e => { if (!group.contains(e.relatedTarget)) set(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen()) { set(false); btn.focus(); }
  });
  document.addEventListener('click', e => { if (isOpen() && !group.contains(e.target)) set(false); });
}

export function initChrome({ deferCookies = false } = {}) {
  /* the reveal styles hide their targets — only arm them once there's
     a script around to bring them back */
  document.documentElement.classList.add('js');

  /* markup first, language second — the injected bits carry keys too */
  const cookies = initConsent();
  initContact();
  initI18n();
  initNav();

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  if (!deferCookies) cookies.maybeOpen();
  return { cookies };
}
