// Client for the standard SMM panel API (v2). One instance per configured provider.
import { config } from './config.js';

function makeProvider({ id, url, key, multiplier }) {
  async function call(params) {
    const body = new URLSearchParams({ key, ...params });
    // Never let a slow provider hang a request forever.
    const res = await fetch(url, { method: 'POST', body, signal: AbortSignal.timeout(25_000) })
      .catch((e) => { throw new Error(`${id}: ${e.name === 'TimeoutError' ? 'timed out' : e.message}`); });
    if (!res.ok) throw new Error(`${id} HTTP ${res.status}`);
    const data = await res.json().catch(() => { throw new Error(`${id}: invalid response`); });
    if (data && data.error) throw new Error(`${id}: ${data.error}`);
    return data;
  }
  return {
    id, multiplier,
    services: () => call({ action: 'services' }),
    add: (service, link, quantity) => call({ action: 'add', service, link, quantity }),
    status: (order) => call({ action: 'status', order }),
    balance: () => call({ action: 'balance' }),
    refill: (order) => call({ action: 'refill', order }),
    cancel: (orders) => call({ action: 'cancel', orders }),
  };
}

export const providers = config.providers.map(makeProvider);
export const getProvider = (id) => providers.find((p) => p.id === id);

// Rate -> PHP factor, learned from each provider's balance currency (cached).
const fx = {};
export async function phpFactor(p) {
  if (fx[p.id] !== undefined) return fx[p.id];
  try {
    const { currency } = await p.balance();
    fx[p.id] = !currency || currency.toUpperCase() === 'PHP' ? 1 : config.pricing.usdToPhp;
    if (fx[p.id] !== 1) console.log(`${p.id} charges in ${currency}; converting x${fx[p.id]} (USD_TO_PHP)`);
  } catch { return 1; } // don't cache failures
  return fx[p.id];
}
