/**
 * Gerador de chaves VAPID para Web Push
 *
 * Uso: node scripts/generate-vapid-keys.js
 *
 * Requer: npm install web-push -g  OU  npx web-push generate-vapid-keys
 *
 * Após gerar:
 *   1. Copie VAPID_PUBLIC_KEY para .env como VITE_VAPID_PUBLIC_KEY
 *   2. Copie VAPID_PRIVATE_KEY para os segredos do Supabase (Dashboard > Edge Functions > Secrets)
 *      Nome do segredo: VAPID_PRIVATE_KEY
 *   3. Também adicione VAPID_SUBJECT como mailto:seu@email.com
 */

const { generateVAPIDKeys } = require('web-push');

const keys = generateVAPIDKeys();

console.log('\n========== VAPID KEYS GERADAS ==========\n');
console.log('VAPID_PUBLIC_KEY (frontend — adicione no .env como VITE_VAPID_PUBLIC_KEY):');
console.log(keys.publicKey);
console.log('\nVAPID_PRIVATE_KEY (backend — adicione como segredo no Supabase):');
console.log(keys.privateKey);
console.log('\n=========================================\n');
console.log('IMPORTANTE: Guarde estas chaves em lugar seguro.');
console.log('Se perder a chave privada, todos os usuários precisarão re-aceitar push.\n');
