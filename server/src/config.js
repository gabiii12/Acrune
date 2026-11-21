// All environment settings in one place. Values come from server/.env (see .env.example).
import { fileURLToPath } from 'node:url';

const num = (v, fallback) => (v === undefined || v === '' ? fallback : Number(v));
const env = process.env;

// Paths are resolved from this file, so the server works no matter which folder it is started from.
const fromRoot = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));

export const config = {
  port: num(env.PORT, 3001),
  // Behind a host/reverse proxy (Render, Railway, nginx...) set TRUST_PROXY=1 so rate limits see real IPs.
  trustProxy: env.TRUST_PROXY ? Number(env.TRUST_PROXY) || 1 : false,

  adminPassword: env.ADMIN_PASSWORD ?? '',
  adminSecret: env.ADMIN_SECRET ?? '',

  gcash: { number: env.GCASH_NUMBER, name: env.GCASH_NAME },

  pricing: {
    multiplier: num(env.PRICE_MULTIPLIER, 1), // 1 = customers pay the provider price
    usdToPhp: num(env.USD_TO_PHP, 58),        // only used if a provider bills in USD
  },

  // Add a provider by setting <NAME>_API_KEY (and optionally <NAME>_API_URL / <NAME>_MULTIPLIER).
  providers: [
    { id: 'zsmm', env: 'ZSMM', url: 'https://www.z-smm.com/api/v2' },
    { id: 'growix', env: 'GROWIX', url: 'https://growixsmm.com/api/v2' },
  ]
    .filter((p) => env[`${p.env}_API_KEY`])
    .map((p) => ({
      id: p.id,
      url: env[`${p.env}_API_URL`] || p.url,
      key: env[`${p.env}_API_KEY`],
      multiplier: num(env[`${p.env}_MULTIPLIER`], num(env.PRICE_MULTIPLIER, 1)),
    })),

  paths: {
    db: fromRoot('orders.db'),
    uploads: fromRoot('uploads/'),
    clientDist: fromRoot('../client/dist'),
  },
};
