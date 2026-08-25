/* ═══════════════════════════════════════════════════════════════
   PAGE — the quiet pages (/zamereni, /blog, /faq)
   ═══════════════════════════════════════════════════════════════
   No scroll engine here: chrome, a reveal on first sight, and enough
   scroll-margin handling that a deep link from the home page lands
   below the fixed bar rather than under it.
   ═══════════════════════════════════════════════════════════════ */

import { initChrome } from './chrome.js';

initChrome();

/* rows ease in as they come into view */
const seen = new IntersectionObserver((entries, obs) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('is-in');
    obs.unobserve(e.target);
  }
}, { threshold: .2, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('[data-reveal], .notes__col, .area__head').forEach(el => seen.observe(el));

/* arriving on #weby from the home page: let the browser do the jump, then
   flag the section so it's obvious which one was asked for */
function markTarget() {
  document.querySelectorAll('.area.is-target').forEach(el => el.classList.remove('is-target'));
  /* an empty hash short-circuits to '' rather than null, which walks
     straight past `?.` and into a string with no classList */
  const el = location.hash ? document.querySelector(location.hash) : null;
  if (el?.classList.contains('area')) el.classList.add('is-target');
}
window.addEventListener('hashchange', markTarget);
markTarget();
