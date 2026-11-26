// Statut d'un paiement, relu chez SasPay (jamais déduit de la seule redirection du client).
import { apiKey, json, saspay } from './_saspay.js';

export async function GET(request) {
  if (!apiKey()) return json({ error: 'Paiement non configuré.' }, 503);
  const id = new URL(request.url).searchParams.get('session') || '';
  if (!/^[A-Za-z0-9_-]{4,80}$/.test(id)) return json({ error: 'Session invalide.' }, 400);

  try {
    const r = await saspay(`/checkout-sessions/${encodeURIComponent(id)}/status/`);
    const d = r.data && r.data.data;
    if (r.status < 200 || r.status >= 300 || !d) {
      console.error(JSON.stringify({ evt: 'status_error', session: id, status: r.status, error: r.data && r.data.error }));
      return json({ status: 'attente' }, r.status === 404 ? 404 : 200);
    }
    const s = String(d.status || '').toUpperCase();
    const t = String(d.transaction_status || '').toUpperCase();
    let status = 'attente';
    if (s === 'EXPIRED' || s === 'CANCELLED') status = 'annule';
    else if (t === 'FAILED') status = 'refuse';
    else if (s === 'PAID' && (!t || t === 'SUCCESS')) {
      // Double contrôle : si un identifiant de paiement est fourni, seul « SUCCESS » au verify confirme.
      const pid = d.payment_id || d.transaction_id || (d.transaction && d.transaction.id);
      if (pid && /^[A-Za-z0-9_-]{4,80}$/.test(String(pid))) {
        const v = await saspay(`/payments/${encodeURIComponent(pid)}/verify/`);
        const vs = String(v.data && v.data.data && v.data.data.status || '').toUpperCase();
        status = vs === 'SUCCESS' ? 'confirme' : vs === 'FAILED' ? 'refuse' : 'attente';
      } else status = 'confirme';
    }
    return json({ status });
  } catch (e) {
    console.error(JSON.stringify({ evt: 'status_exception', session: id, message: String(e && e.message) }));
    return json({ status: 'attente' });
  }
}
