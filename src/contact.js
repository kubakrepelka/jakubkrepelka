import { SERVICES, validateContact } from '../shared/contact.js';

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;


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
  const open = async service => {
    clearTimeout(closing);
    pane.hidden = false; done.hidden = true;
    // A CTA on one of the four zaměření pages names its service up front.
    if (SERVICES.includes(service)) form.elements.namedItem('service').value = service;
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
    const trigger = e.target.closest('[data-contact]');
    if (!trigger) return;
    e.preventDefault(); open(trigger.dataset.contact);
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
