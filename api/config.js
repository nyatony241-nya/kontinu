// Indique au site si le paiement en ligne est branché, et en quel mode. Ne renvoie aucun secret.
import { apiKey, isTest, json } from './_saspay.js';

export function GET() {
  return json({ active: Boolean(apiKey()), test: isTest() });
}
