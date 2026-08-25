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
   the page. All this owns is the phone menu */
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
  panel.addEventListener('click', e => { if (e.target.closest('a, button')) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  document.addEventListener('click', e => {
    if (nav.classList.contains('is-open') && !nav.contains(e.target)) setOpen(false);
  });
  /* the sheet is a phone affordance — a resize past the breakpoint drops it */
  window.matchMedia('(min-width: 60rem)').addEventListener('change', e => {
    if (e.matches) setOpen(false);
  });
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
