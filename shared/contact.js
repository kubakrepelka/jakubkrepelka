// Shared browser/server contract. No server configuration belongs here.
export const SERVICES = ['Webové stránky', 'Aplikace', 'AI automatizace', 'AI školení'];
export function validateContact(input) {
  const data = {};
  const errors = {};
  const limits = { name: 100, email: 254, phone: 30, service: 80, message: 5000 };
  for (const [key, max] of Object.entries(limits)) {
    data[key] = typeof input?.[key] === 'string' ? input[key].trim() : '';
    if (!data[key] && key !== 'phone') errors[key] = 'Vyplňte prosím toto pole.';
    if (data[key].length > max) errors[key] = `Použijte nejvýše ${max} znaků.`;
  }
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email)) errors.email = 'Zadejte platný e-mail.';
  if (/[\r\n\x00-\x1f]/.test(data.name)) errors.name = 'Zadejte jméno bez řídicích znaků.';
  if (data.phone && (!/^\+?[\d ()-]+$/.test(data.phone) || data.phone.replace(/\D/g, '').length < 7 || data.phone.replace(/\D/g, '').length > 15)) errors.phone = 'Zadejte platné telefonní číslo, nebo pole nechte prázdné.';
  if (!SERVICES.includes(data.service)) errors.service = 'Vyberte typ služby.';
  return { data, errors, valid: Object.keys(errors).length === 0 };
}
