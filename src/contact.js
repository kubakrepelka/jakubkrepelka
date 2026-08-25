/* ═══════════════════════════════════════════════════════════════
   CONTACT — the CTA's popup form
   ═══════════════════════════════════════════════════════════════

   Every primary CTA on the site is a `mailto:` link carrying
   `data-contact`. This intercepts the click and opens a native
   <dialog> instead — so the form is the path, and the plain mailto
   stays the fallback if the script never runs.

   There's no backend. On submit the answers are folded into a prefilled
   mail and the visitor's own client sends it. Point ENDPOINT at a form
   service (Formspree, a serverless function, whatever) and it POSTs the
   JSON there instead, no other change needed.
   ═══════════════════════════════════════════════════════════════ */

const ENDPOINT = null;                    // e.g. 'https://formspree.io/f/xxxx'
const MAIL = 'jk.krepjak@gmail.com';

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
      <p class="eyebrow" data-i18n="form.sent.eyebrow">Odesláno</p>
      <h2 class="modal__title" data-i18n="form.sent.title">Otevřel se váš e-mail</h2>
      <p class="modal__text" data-i18n="form.sent.text">Zpráva je předvyplněná ve vašem e-mailovém klientovi — stačí ji odeslat.</p>
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
    btn.disabled = true;

    if (ENDPOINT) {
      try {
        await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
      } catch { /* fall through to the mail client */ }
    } else {
      const subject = `Poptávka z webu — ${data.name}`;
      const body = `${data.message}\n\n—\n${data.name}\n${data.email}`;
      window.location.href =
        `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    btn.disabled = false;
    form.reset();
    show('done');
  });

  return { open, close };
}
