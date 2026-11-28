// Délivre le jeton de l'offre de bienvenue (-5 % pendant 30 minutes) lors de la première visite.
import { apiKey, json, signPromo } from './_saspay.js';

export function GET() {
  if (!apiKey()) return json({ error: 'not_configured' }, 503);
  const iat = Date.now();
  return json({ iat, sig: signPromo(iat) });
}
