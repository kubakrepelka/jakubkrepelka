/* ═══════════════════════════════════════════════════════════════
   CONTACT — the CTA's popup form
   ═══════════════════════════════════════════════════════════════

   Every primary CTA on the site is a `mailto:` link carrying
   `data-contact`. This intercepts the click and opens a native
   <dialog> instead — so the form is the path, and the plain mailto
   stays the fallback if the script never runs.

   There's still no backend of our own. Submissions POST as JSON to
   Web3Forms, which forwards them to MAIL. The access key is public by
   design — it only names the mailbox a message lands in, it reads
   nothing back — so it belongs in client code. Free plan: 250 a month.

   If that request fails — offline, blocked, service down, slow — the
   handler hands the answers to the visitor's own mail client instead,
   prefilled, so nothing they typed is lost.
   ═══════════════════════════════════════════════════════════════ */

import { dict, lang } from './i18n.js';

const ENDPOINT   = 'https://api.web3forms.com/submit';
const ACCESS_KEY = 'bc2f1fed-cd3e-4a72-9bff-b34305ecd12e';   // public key from the Web3Forms dashboard
const MAIL       = 'info@jkweby.cz';
const TIMEOUT    = 10000;               // ms — past this we stop waiting and open the mail client

const html = `
<dialog class="modal" id="contact">
  <form class="modal__box" method="dialog">
    <button class="modal__x" type="button" data-close data-i18n-label="form.close" aria-label="Zavřít">×</button>

    <div class="modal__pane" data-pane="form">
      <p class="eyebrow" data-i18n="form.eyebrow">Kontakt</p>
      <h2 class="modal__title" data-i18n="form.title">Pojďme do toho</h2>
      <p class="modal__text" data-i18n="form.text">Napište mi pár vět o tom, co potřebujete. Ozvu se do 24 hodin.</p>

      <label class="field">
        <span class="field__label" data-i18n="form.name">Jméno</span>
        <input class="field__input" name="name" type="text" required autocomplete="name"
               data-i18n-ph="form.name.ph" placeholder="Jan Novák" />
      </label>
      <label class="field">
        <span class="field__label" data-i18n="form.email">E-mail</span>
        <input class="field__input" name="email" type="email" required autocomplete="email"
               data-i18n-ph="form.email.ph" placeholder="jan@firma.cz" />
      </label>
      <label class="field">
        <span class="field__label" data-i18n="form.msg">Co potřebujete?</span>
        <textarea class="field__input" name="message" rows="4" required
                  data-i18n-ph="form.msg.ph" placeholder="Potřebuji web pro…"></textarea>
      </label>

      <!-- honeypot: no visitor can see or tab into it, a bot ticks it and
           Web3Forms drops the submission on its side -->
      <input type="checkbox" name="botcheck" style="display:none" tabindex="-1" autocomplete="off" aria-hidden="true" />

      <div class="modal__actions">
        <button class="btn btn--primary" type="submit" data-send>
          <span data-i18n="form.send">Odeslat</span><i aria-hidden="true">→</i>
        </button>
        <p class="modal__alt">
          <span data-i18n="form.or">Nebo mi napište přímo:</span>
          <a href="mailto:${MAIL}">${MAIL}</a>
        </p>
      </div>
    </div>

    <div class="modal__pane" data-pane="done" hidden>
      <p class="eyebrow" data-i18n="form.ok.eyebrow">Odesláno</p>
      <h2 class="modal__title" data-i18n="form.ok.title">Zpráva je na cestě</h2>
      <p class="modal__text" data-i18n="form.ok.text">Přišla mi do schránky. Ozvu se do 24 hodin.</p>
      <p class="modal__alt">
        <span data-i18n="form.or">Nebo mi napište přímo:</span>
        <a href="mailto:${MAIL}">${MAIL}</a>
      </p>
      <div class="modal__actions">
        <button class="btn btn--ghost" type="button" data-close><span data-i18n="form.close">Zavřít</span></button>
      </div>
    </div>
  </form>
</dialog>`;

/* the two ways this can end, as i18n keys: the POST went through, or the
   visitor's own mail client took over */
const ENDING = {
  ok:   ['form.ok.eyebrow',   'form.ok.title',   'form.ok.text'],
  mail: ['form.sent.eyebrow', 'form.sent.title', 'form.sent.text'],
};

/* re-labels an element *and* re-keys it, so a later language switch
   re-translates whichever ending is on screen */
function paint(el, key) {
  if (!el) return;
  el.dataset.i18n = key;
  const v = dict[lang]?.[key] ?? dict.cs[key];
  if (v != null) el.textContent = v;
}

async function post(data) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        ...data,                        // name · email · message (+ botcheck, if a bot ticked it)
        access_key: ACCESS_KEY,
        from_name: data.name,
        replyto: data.email,            // hitting Reply in the inbox writes back to them
        subject: lang === 'en'
          ? `Website enquiry — ${data.name}`
          : `Poptávka z webu — ${data.name}`,
      }),
      signal: ctrl.signal,
    });
    const out = await res.json().catch(() => ({}));
    return res.ok && out.success === true;
  } catch {
    return false;                       // offline, blocked, aborted — the caller falls back
  } finally {
    clearTimeout(timer);
  }
}

function handOver(data) {
  const subject = lang === 'en'
    ? `Website enquiry — ${data.name}`
    : `Poptávka z webu — ${data.name}`;
  const body = `${data.message}\n\n—\n${data.name}\n${data.email}`;
  window.location.href =
    `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function initContact() {
  document.body.insertAdjacentHTML('beforeend', html);

  const dlg = document.getElementById('contact');
  const form = dlg.querySelector('form');
  const panes = {
    form: dlg.querySelector('[data-pane="form"]'),
    done: dlg.querySelector('[data-pane="done"]'),
  };

  const show = which => {
    panes.form.hidden = which !== 'form';
    panes.done.hidden = which !== 'done';
  };

  const finish = kind => {
    const [eyebrow, title, text] = ENDING[kind];
    paint(panes.done.querySelector('.eyebrow'), eyebrow);
    paint(panes.done.querySelector('.modal__title'), title);
    paint(panes.done.querySelector('.modal__text'), text);
    show('done');
  };

  const open = () => {
    show('form');
    dlg.showModal();
    /* let the animation start from closed */
    requestAnimationFrame(() => dlg.classList.add('is-open'));
  };
  const close = () => {
    dlg.classList.remove('is-open');
    setTimeout(() => dlg.close(), 240);
  };

  /* every CTA on the page — the href stays a working mailto if this
     script never gets the chance to run */
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-contact]');
    if (!trigger) return;
    e.preventDefault();
    open();
  });

  dlg.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) close();
    else if (e.target === dlg) close();           // the backdrop
  });
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form));
    const btn = form.querySelector('[data-send]');
    const label = btn.querySelector('span');

    btn.disabled = true;
    paint(label, 'form.sending');

    const sent = await post(data);

    btn.disabled = false;
    paint(label, 'form.send');
    form.reset();

    if (sent) finish('ok');
    else { handOver(data); finish('mail'); }
  });

  return { open, close };
}
