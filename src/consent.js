/* ═══════════════════════════════════════════════════════════════
   COOKIE CONSENT
   ═══════════════════════════════════════════════════════════════

   Nothing is measured yet — the site sets no analytics or advertising
   cookies today. This exists so that when measurement is switched on,
   the choice is already asked for, stored and honoured rather than
   bolted on afterwards.

   To actually turn analytics on: drop the snippet into `enable()` below.
   It runs when consent is granted (either freshly, or on the next visit
   from the stored answer) and never runs otherwise.

   The bar injects its own markup, so every page gets it by importing
   this — there's no copy of it in any HTML file.
   ═══════════════════════════════════════════════════════════════ */

const KEY = 'jk-consent';                 // 'granted' | 'denied'

const store = {
  get() { try { return localStorage.getItem(KEY); } catch { return null; } },
  set(v) { try { localStorage.setItem(KEY, v); } catch { /* fine */ } },
};

export const consent = {
  get state() { return store.get(); },
  get granted() { return store.get() === 'granted'; },
};

/* ── the analytics hook ──────────────────────────────────────── */
let running = false;
function enable() {
  if (running) return;
  running = true;
  /* ▸ analytics snippet goes here (Plausible, GA4, …). Until then the
       consent is simply recorded, and nothing is loaded either way. */
}

const html = `
<div class="cookie" id="cookie" role="dialog" aria-labelledby="cookieTitle" hidden>
  <div class="cookie__inner">
    <div class="cookie__copy">
      <p class="cookie__title" id="cookieTitle" data-i18n="cookie.title">Cookies</p>
      <p class="cookie__text" data-i18n="cookie.text">Zatím tu neběží žádná analytika ani reklamní cookies — jen to nutné, aby web fungoval.</p>
    </div>
    <div class="cookie__actions">
      <button class="btn btn--sm btn--primary" type="button" data-consent="granted" data-i18n="cookie.accept">Souhlasím</button>
      <button class="btn btn--sm btn--ghost" type="button" data-consent="denied" data-i18n="cookie.decline">Jen nutné</button>
    </div>
  </div>
</div>`;

/* ── banner ──────────────────────────────────────────────────── */
export function initConsent() {
  document.body.insertAdjacentHTML('beforeend', html);
  const bar = document.getElementById('cookie');

  const open = () => {
    bar.hidden = false;
    requestAnimationFrame(() => bar.classList.add('is-open'));
  };
  const close = () => {
    bar.classList.remove('is-open');
    bar.addEventListener('transitionend', () => { bar.hidden = true; }, { once: true });
  };

  bar.querySelectorAll('[data-consent]').forEach(btn => {
    btn.addEventListener('click', () => {
      const answer = btn.dataset.consent;
      store.set(answer);
      if (answer === 'granted') enable();
      close();
    });
  });

  /* the footer link lets anyone change their mind later */
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-cookie-open]')) return;
    e.preventDefault();
    open();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !bar.hidden) close();
  });

  if (consent.granted) enable();

  return { open, maybeOpen: () => { if (!consent.state) open(); } };
}
