// Crée une session de paiement hébergée SasPay. Le montant est toujours calculé ici, jamais repris du navigateur.
import { MAX_QTY, CURRENCY, apiKey, isTest, appUrl, json, saspay, publicError, norm, newRef, computeTotal } from './_saspay.js';

export async function POST(request) {
  if (!apiKey()) return json({ error: 'Le paiement en ligne n’est pas encore ouvert.' }, 503);

  let b;
  try { b = await request.json(); } catch { return json({ error: 'Demande invalide.' }, 400); }

  const qty = Number(b.qty);
  const name = String(b.name || '').trim().slice(0, 120);
  const email = String(b.email || '').trim().slice(0, 160);
  const phoneDigits = String(b.phone || '').replace(/[^\d+]/g, '');
  const country = String(b.country || '').toUpperCase();
  const city = String(b.city || '').trim().slice(0, 80);
  const pm = b.pm === 'momo' ? 'momo' : 'carte';

  const errs = [];
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) errs.push('quantité');
  if (name.length < 3) errs.push('nom');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('e-mail');
  if (phoneDigits.replace(/\D/g, '').length < 8) errs.push('téléphone');
  // Seule destination ouverte : retrait à Libreville (Gabon).
  if (country !== 'GA' || norm(city) !== 'libreville') errs.push('destination');
  if (errs.length) return json({ error: `Informations à corriger : ${errs.join(', ')}.` }, 400);

  const ref = newRef();
  const { pack, disc, total } = computeTotal(qty, b.promo);
  const body = {
    amount: `${total}.00`,
    currency: CURRENCY,
    description: `Kontinu ${ref} - Mini-onduleur WGP x${qty} - retrait AIC Cargo Libreville`,
    customer_name: name,
    customer_email: email,
    customer_phone: phoneDigits.startsWith('+') ? phoneDigits : `+${phoneDigits}`,
    return_url: `${appUrl()}/#paiement-attente`,
    metadata: { ref, qty: String(qty), country, city, phone: phoneDigits, moyen_choisi: pm, remise_pack: String(pack), remise_bienvenue: String(disc) }
  };

  try {
    let r = await saspay('/checkout-sessions/', { method: 'POST', body });
    // Si le format du téléphone est refusé, on réessaie une fois sans ce champ facultatif.
    if (r.status === 400 && r.data && r.data.customer_phone) {
      delete body.customer_phone;
      r = await saspay('/checkout-sessions/', { method: 'POST', body });
    }
    const d = r.data && r.data.data;
    if (r.status >= 200 && r.status < 300 && r.data && r.data.success !== false && d && d.checkout_url && d.id) {
      console.log(JSON.stringify({ evt: 'checkout_created', ref, session: d.id, total, qty, pack, disc, test: isTest() }));
      return json({ ref, session: String(d.id), url: d.checkout_url, total, pack, disc, test: isTest() });
    }
    console.error(JSON.stringify({ evt: 'checkout_error', ref, status: r.status, error: r.data && (r.data.error || r.data) }));
    return json({ error: publicError(r.status) }, 502);
  } catch (e) {
    console.error(JSON.stringify({ evt: 'checkout_exception', ref, message: String(e && e.message) }));
    return json({ error: publicError(0) }, 502);
  }
}
