// Indique au site si le paiement en ligne est branché, et en quel mode. Ne renvoie aucun secret.
import { apiKey, isTest, isPublic, json } from './_saspay.js';

export function GET() {
  // open : bouton « Payer » visible par tous. Clé de test : jamais public. Clé réelle : seulement si SASPAY_PUBLIC=1.
  return json({ active: Boolean(apiKey()), test: isTest(), open: !isTest() && isPublic() });
}
