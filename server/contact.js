import { createHash } from 'node:crypto';
import { Resend } from 'resend';
import { validateContact } from '../shared/contact.js';

// Best-effort per-instance limit; serverless instances do not share this map.
const attempts = new Map();
function allowed(ip) {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  const key = createHash('sha256').update(ip).digest('hex');
  const value = attempts.get(key) || { count: 0, until: now + 600_000 };
  if (attempts.size >= 10_000 && !attempts.has(key)) return false;
  attempts.set(key, value);
  return ++value.count <= 5;
}

export function createContactHandler({ env = process.env, send, fetcher = fetch, limit = allowed } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    const respond = (status, body) => res.status(status).json(body);
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return respond(405, { error: 'Použijte odeslání formuláře.' });
    }
    const origins = new Set(['https://jkweby.cz', 'https://www.jkweby.cz']);
    if (env.VERCEL_URL) origins.add(`https://${env.VERCEL_URL}`);
    if (env.NODE_ENV !== 'production') { origins.add('http://localhost:5173'); origins.add('http://localhost:3000'); }
    if (req.headers.origin && !origins.has(req.headers.origin)) return respond(403, { error: 'Odešlete poptávku přímo z našeho webu.' });
    if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) return respond(415, { error: 'Neplatný formát požadavku.' });
    if (Number(req.headers['content-length']) > 24_000) return respond(413, { error: 'Zpráva je příliš dlouhá.' });
    let input;
    try {
      input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error();
      if (Buffer.byteLength(JSON.stringify(input)) > 24_000) return respond(413, { error: 'Zpráva je příliš dlouhá.' });
    } catch { return respond(400, { error: 'Neplatná data formuláře.' }); }
    if (input.website) return respond(200, { success: true });
    const { data, errors, valid } = validateContact(input);
    if (!valid) return respond(400, { error: 'Zkontrolujte prosím vyplněné údaje.', errors });
    if (typeof input.requestId !== 'string' || !/^[a-f0-9-]{36}$/.test(input.requestId)) return respond(400, { error: 'Obnovte stránku a zkuste to znovu.' });
    const ip = req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    if (!limit(String(ip))) {
      res.setHeader('Retry-After', '600');
      return respond(429, { error: 'Odesíláte příliš často. Zkuste to prosím za 10 minut.' });
    }
    if (!env.RESEND_API_KEY || !env.CONTACT_EMAIL || !env.CONTACT_FROM_EMAIL) return respond(503, { error: 'Formulář je dočasně nedostupný. Napište prosím na info@jkweby.cz.' });
    try {
      if (env.TURNSTILE_SECRET_KEY) {
        if (typeof input.turnstileToken !== 'string' || input.turnstileToken.length > 2048 || !input.turnstileToken) return respond(400, { error: 'Potvrďte prosím ochranu proti spamu.' });
        const verification = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST', body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: input.turnstileToken }), signal: AbortSignal.timeout(8000),
        });
        const result = await verification.json();
        const hosts = (env.TURNSTILE_HOSTNAMES || 'jkweby.cz,www.jkweby.cz').split(',').map(s => s.trim());
        if (!verification.ok || !result.success || result.action !== 'contact' || !hosts.includes(result.hostname)) return respond(400, { error: 'Ověření proti spamu vypršelo. Zkuste to znovu.' });
      }
      const sendEmail = send || ((...args) => new Resend(env.RESEND_API_KEY).emails.send(...args));
      // Stable payload and key across retries, including after an ambiguous timeout.
      const id = createHash('sha256').update(JSON.stringify([input.requestId, data])).digest('hex');
      const main = await sendEmail({
        from: env.CONTACT_FROM_EMAIL, to: env.CONTACT_EMAIL, replyTo: data.email,
        subject: 'Nová poptávka z jkweby.cz',
        text: `Nová poptávka z jkweby.cz\n\nJméno: ${data.name}\nE-mail: ${data.email}\nTelefon: ${data.phone || 'Neuveden'}\nSlužba: ${data.service}\n\nZpráva:\n${data.message}`,
      }, { idempotencyKey: `contact-${id}` });
      if (main.error || !main.data?.id) throw new Error('inquiry_send_failed');
      // Main inquiry is already accepted. Confirmation failure must not prompt a resubmit.
      if (env.CONTACT_SEND_CONFIRMATION !== 'false') {
        try {
          const confirmation = await sendEmail({
            from: env.CONTACT_FROM_EMAIL, to: data.email, replyTo: env.CONTACT_EMAIL,
            subject: 'Děkuji za vaši poptávku — JK WEBY',
            text: 'Dobrý den,\n\nděkuji za vaši poptávku. Zprávu jsem přijal a co nejdříve se vám ozvu.\n\nJakub\nJK WEBY\nhttps://jkweby.cz',
          }, { idempotencyKey: `contact-confirmation-${id}` });
          if (confirmation.error || !confirmation.data?.id) console.warn('contact_confirmation_failed');
        } catch { console.warn('contact_confirmation_failed'); }
      }
      return respond(200, { success: true });
    } catch {
      console.error('contact_submission_failed');
      return respond(502, { error: 'Odeslání se nepodařilo potvrdit. Zkuste to znovu, nebo napište na info@jkweby.cz.' });
    }
  };
}
