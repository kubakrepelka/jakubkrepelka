/* ═══════════════════════════════════════════════════════════════
   PAGE — the quiet pages (the four zaměření pages, /blog, /faq)
   ═══════════════════════════════════════════════════════════════
   No scroll engine here: chrome, and a reveal on first sight.
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

document.querySelectorAll('[data-reveal], .notes__col, .more').forEach(el => seen.observe(el));

