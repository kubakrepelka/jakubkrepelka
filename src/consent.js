/* ═══════════════════════════════════════════════════════════════
   COOKIE CONSENT
   ═══════════════════════════════════════════════════════════════

   Measurement is Vercel Web Analytics, and it is gated on this file.
   It starts when consent is granted (either freshly, or on the next
   visit from the stored answer) and never runs otherwise — `enable()`
   below is the single place it is switched on.

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
/* Vercel Web Analytics — cookieless, and reached only from here, so a
   visitor who declines never fetches a byte of it. The import is dynamic
   for that reason: Vite splits it into its own chunk, requested the moment
   consent is granted and never before.

   `inject()` counts the current page view. This is a multi-page site, so
   every later navigation is a fresh document that counts itself — there is
   no client-side routing to report. In dev it logs to the console instead
   of sending, and in production it needs Web Analytics enabled on the
   Vercel project. */
let running = false;
function enable() {
  if (running) return;
  running = true;
  import('@vercel/analytics').then(({ inject }) => inject());
}

const html = `
<div class="cookie" id="cookie" role="dialog" aria-labelledby="cookieTitle" hidden>
  <div class="cookie__inner">
    <div class="cookie__copy">
      <p class="cookie__title" id="cookieTitle" data-i18n="cookie.title">Cookies</p>
      <p class="cookie__text" data-i18n="cookie.text">Měřím jen anonymní návštěvnost, bez cookies a bez reklamních skriptů.</p>
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
