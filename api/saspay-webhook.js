// Notifications SasPay. Signature vérifiée sur le corps brut avant toute lecture.
// Adresse à déclarer dans le tableau de bord SasPay : https://boutique-kontinu.vercel.app/api/saspay-webhook
import { json, webhookIsValid } from './_saspay.js';

export async function POST(request) {
  const secret = process.env.SASPAY_WEBHOOK_SECRET || '';
  if (!secret) return json({ error: 'not_configured' }, 503);

  const raw = await request.text();
  const ok = webhookIsValid(raw, request.headers.get('x-webhook-signature'), request.headers.get('x-webhook-timestamp'), secret);
  if (!ok) return json({ error: 'invalid_signature' }, 403);

  let evt = {};
  try { evt = JSON.parse(raw); } catch { return json({ error: 'invalid_body' }, 400); }
  const d = evt.data || {};
  // Journal (Vercel > projet kontinu > Logs). Le traitement est idempotent : on ne fait que consigner, par identifiant.
  console.log(JSON.stringify({
    evt: 'saspay_webhook', event: evt.event, id: d.id, reference: d.reference, status: d.status,
    amount: d.amount, charged: d.charged, net_amount: d.net_amount, currency: d.currency, country: d.country, network: d.network
  }));
  return json({ received: true });
}
