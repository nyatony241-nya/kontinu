// Outils partagés des fonctions serveur SasPay (fichier non exposé : préfixe « _ »).
// La clé API reste ici, côté serveur : jamais envoyée au navigateur ni écrite dans le dépôt.
import crypto from 'node:crypto';

export const PRICE = 10000;          // prix unitaire, XAF
export const PACK2 = 18000;          // pack duo : 2 produits, XAF
export const PROMO_PCT = 5;          // offre de bienvenue
export const PROMO_MS = 30 * 60 * 1000; // durée de l'offre
const PROMO_GRACE_MS = 2 * 60 * 1000;  // tolérance réseau au moment du clic
export const SHIP_FEE = 0;           // retrait AIC Cargo, Libreville : inclus dans le prix
export const MAX_QTY = 5;
export const CURRENCY = 'XAF';

export const apiKey = () => process.env.SASPAY_API_KEY || '';
export const isTest = () => apiKey().startsWith('sk_test_');
// Ouverture au public d'une clé réelle : uniquement si SASPAY_PUBLIC=1 est posé dans Vercel (décision du propriétaire).
export const isPublic = () => process.env.SASPAY_PUBLIC === '1';
export const appUrl = () => (process.env.APP_URL || 'https://boutique-kontinu.vercel.app').replace(/\/+$/, '');

// Le bac à sable est choisi par l'hôte : une clé sk_test_ va par défaut vers sandbox-api.
// SASPAY_BASE_URL permet de forcer une autre adresse si SasPay l'indique.
export const baseUrl = () => (process.env.SASPAY_BASE_URL ||
  (isTest() ? 'https://sandbox-api.saspay.me/api/v1' : 'https://api.saspay.me/api/v1')).replace(/\/+$/, '');

export const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

export async function saspay(path, { method = 'GET', body } = {}) {
  const res = await fetch(baseUrl() + path, {
    method,
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000)
  });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

// Message lisible pour le client, sans détail technique ni secret.
export function publicError(status) {
  if (status === 401 || status === 403) return 'Le paiement en ligne est momentanément indisponible. Contactez notre service client.';
  if (status === 429) return 'Trop de demandes en même temps. Réessayez dans une minute.';
  if (status === 400 || status === 422) return 'Le paiement n’a pas pu être préparé avec ces informations. Vérifiez-les ou contactez notre service client.';
  return 'Le paiement n’a pas pu être lancé. Réessayez dans un instant.';
}

export const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

export function newRef() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return `CMD-${String(d.getUTCFullYear()).slice(2)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

// Vérification d'un webhook : âge ≤ 300 s, HMAC-SHA256 hexadécimal de "{timestamp}.{corps brut}", comparaison en temps constant.
export function webhookIsValid(rawBody, signature, timestamp, secret) {
  if (!secret || !signature || !/^\d+$/.test(timestamp || '')) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  const a = Buffer.from(expected, 'utf8'), b = Buffer.from(String(signature).trim().toLowerCase(), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Prix : pack duo par paire, puis remise de bienvenue si le jeton signé a moins de 30 minutes.
export function computeTotal(qty, promo) {
  const pairs = Math.floor(qty / 2);
  const list = PRICE * qty;
  const base = pairs * PACK2 + (qty - 2 * pairs) * PRICE;
  const disc = promoIsValid(promo) ? Math.round(base * PROMO_PCT / 100) : 0;
  return { list, pack: list - base, disc, total: base - disc + SHIP_FEE };
}

// Jeton d'offre de bienvenue : signé côté serveur, impossible à fabriquer sans la clé.
const promoKey = () => crypto.createHash('sha256').update('kontinu-promo|' + (process.env.PROMO_SECRET || apiKey())).digest();
export function signPromo(iat) {
  return crypto.createHmac('sha256', promoKey()).update(`promo:${iat}`).digest('hex');
}
export function promoIsValid(promo) {
  if (!promo || !apiKey()) return false;
  const iat = Number(promo.iat), sig = String(promo.sig || '');
  if (!Number.isFinite(iat) || !/^[a-f0-9]{64}$/.test(sig)) return false;
  const age = Date.now() - iat;
  if (age < -60000 || age > PROMO_MS + PROMO_GRACE_MS) return false;
  const a = Buffer.from(signPromo(iat)), b = Buffer.from(sig);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
