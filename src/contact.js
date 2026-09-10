import { SERVICES, validateContact } from '../shared/contact.js';

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const field = (name, label, attributes) => `<label class="field"><span class="field__label">${label}</span><input class="field__input" name="${name}" aria-describedby="contact-${name}-error" ${attributes}><span class="field__error" id="contact-${name}-error"></span></label>`;
const html = `
<dialog class="modal" id="contact" lang="cs" aria-labelledby="contact-title" data-lenis-prevent>
  <form class="modal__box" novalidate>
    <button class="modal__x" type="button" data-close aria-label="Zavřít">×</button>
    <div data-pane="form">
      <p class="eyebrow">Kontakt</p>
      <h2 class="modal__title" id="contact-title">Poptat službu</h2>
      <p class="modal__text">Napište mi, co potřebujete. Co nejdříve se vám ozvu.</p>
      ${field('name', 'Jméno', 'type="text" required maxlength="100" autocomplete="name" placeholder="Jan Novák"')}
      ${field('email', 'E-mail', 'type="email" required maxlength="254" autocomplete="email" placeholder="jan@firma.cz"')}
      ${field('phone', 'Telefon (nepovinný)', 'type="tel" maxlength="30" autocomplete="tel" placeholder="+420 777 123 456"')}
      <label class="field"><span class="field__label">Typ služby</span>
        <select class="field__input" name="service" required aria-describedby="contact-service-error">
          <option value="">Vyberte službu</option>${SERVICES.map(s => `<option>${s}</option>`).join('')}
        </select><span class="field__error" id="contact-service-error"></span>
      </label>
      <label class="field"><span class="field__label">Zpráva</span>
        <textarea class="field__input" name="message" rows="4" required maxlength="5000" aria-describedby="contact-message-error" placeholder="Potřebuji web pro…"></textarea>
        <span class="field__error" id="contact-message-error"></span>
      </label>
      <div hidden aria-hidden="true"><label>Web<input name="website" tabindex="-1" autocomplete="off"></label></div>
      <div data-turnstile></div>
      <p class="modal__error" role="alert" tabindex="-1" hidden></p>
      <div class="modal__actions">
        <button class="btn btn--primary" type="submit" data-send><span>Odeslat poptávku</span><i aria-hidden="true">→</i></button>
        <p class="modal__alt">Nebo mi napište přímo: <a href="mailto:info@jkweby.cz">info@jkweby.cz</a></p>
      </div>
    </div>
    <div data-pane="done" hidden tabindex="-1" role="status">
      <p class="eyebrow">Odesláno</p><h2 class="modal__title">Děkuji!</h2>
      <p class="modal__text">Poptávka byla úspěšně odeslána. Co nejdříve se vám ozvu.</p>
      <div class="modal__actions"><button class="btn btn--ghost" type="button" data-close>Zavřít</button></div>
    </div>
  </form>
</dialog>`;

let turnstileLoader;
function loadTurnstile() {
  if (!turnstileLoader) turnstileLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => { turnstileLoader = null; script.remove(); reject(new Error('turnstile')); };
    document.head.append(script);
  });
  return turnstileLoader;
}

export function initContact() {
  document.body.insertAdjacentHTML('beforeend', html);
  const dlg = document.getElementById('contact');
  const form = dlg.querySelector('form');
  const pane = dlg.querySelector('[data-pane="form"]');
  const done = dlg.querySelector('[data-pane="done"]');
  const error = dlg.querySelector('.modal__error');
  const btn = dlg.querySelector('[data-send]');
  let busy = false, widget, token = '', requestId = crypto.randomUUID(), closing;
  const showError = message => { error.textContent = message; error.hidden = false; error.focus(); };
  const clearErrors = () => {
    error.hidden = true;
    form.querySelectorAll('.field__error').forEach(el => { el.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  };
  const fieldErrors = errors => {
    for (const [name, message] of Object.entries(errors)) {
      const input = form.elements.namedItem(name);
      const feedback = document.getElementById(`contact-${name}-error`);
      if (input && feedback) { input.setAttribute('aria-invalid', 'true'); feedback.textContent = message; }
    }
    form.querySelector('[aria-invalid]')?.focus();
  };
  const open = async () => {
    clearTimeout(closing);
    pane.hidden = false; done.hidden = true;
    if (!dlg.open) dlg.showModal();
    requestAnimationFrame(() => dlg.classList.add('is-open'));
    if (siteKey && widget === undefined) {
      try {
        const api = await loadTurnstile();
        if (widget !== undefined) return;
        widget = api.render(dlg.querySelector('[data-turnstile]'), {
          sitekey: siteKey, action: 'contact', language: 'cs', theme: 'dark', size: 'flexible',
          callback: value => { token = value; },
          'expired-callback': () => { token = ''; },
          'error-callback': () => { token = ''; showError('Ochranu proti spamu se nepodařilo načíst. Zkuste formulář znovu otevřít.'); },
        });
      } catch { showError('Ochranu proti spamu se nepodařilo načíst. Zkuste formulář znovu otevřít.'); }
    } else if (widget !== undefined && !token && !busy) window.turnstile.reset(widget);
  };
  const close = () => { dlg.classList.remove('is-open'); closing = setTimeout(() => dlg.close(), 240); };
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-contact]')) return;
    e.preventDefault(); open();
  });
  dlg.addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target === dlg) close(); });
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (busy) return;
    clearErrors();
    const input = Object.fromEntries(new FormData(form));
    const checked = validateContact(input);
    if (!checked.valid) { fieldErrors(checked.errors); return; }
    if (siteKey && !token) { showError('Počkejte prosím na ověření proti spamu.'); return; }
    busy = true; btn.disabled = true; form.setAttribute('aria-busy', 'true');
    btn.querySelector('span').textContent = 'Odesílám…';
    // Freeze fields so an in-flight success cannot erase newly typed changes.
    const fields = [...form.querySelectorAll('input, select, textarea')];
    fields.forEach(el => { el.disabled = true; });
    try {
      const response = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...checked.data, website: input.website, requestId, turnstileToken: token }),
        signal: AbortSignal.timeout(25000),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        showError(result.error || 'Odeslání se nepodařilo. Zkuste to prosím znovu.');
        if (result.errors) fieldErrors(result.errors);
        return;
      }
      form.reset(); requestId = crypto.randomUUID();
      pane.hidden = true; done.hidden = false; done.focus();
    } catch { showError('Odeslání se nepodařilo potvrdit. Zkuste to znovu, nebo napište na info@jkweby.cz.'); }
    finally {
      busy = false; btn.disabled = false; form.removeAttribute('aria-busy');
      fields.forEach(el => { el.disabled = false; });
      btn.querySelector('span').textContent = 'Odeslat poptávku';
      if (widget !== undefined) { token = ''; window.turnstile.reset(widget); }
    }
  });
  return { open, close };
}
