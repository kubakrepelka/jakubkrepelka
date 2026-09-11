import { SERVICES } from './contact.js';

const field = (name, label, attributes) => `<label class="field"><span class="field__label">${label}</span><input class="field__input" name="${name}" aria-describedby="contact-${name}-error" ${attributes}><span class="field__error" id="contact-${name}-error"></span></label>`;
export const contactMarkup = `
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
