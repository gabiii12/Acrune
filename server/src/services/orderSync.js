// Keeps local order status in step with the provider (processing -> completed/partial/canceled).
import { db } from '../db.js';
import { getProvider } from '../providers.js';

// Provider status -> our final status. Anything else means still running.
const FINAL = { completed: 'completed', partial: 'partial', canceled: 'canceled', cancelled: 'canceled' };

// Pull the latest delivery status from the provider, store it and return the fresh row.
export async function syncOrder(o) {
  const p = getProvider(o.provider);
  if (!p || !o.zsmm_order_id || o.status !== 'processing') return o;
  try {
    const st = await p.status(o.zsmm_order_id);
    const fin = FINAL[String(st.status || '').toLowerCase()];
    const remains = st.remains === undefined || st.remains === null ? null : Number(st.remains);
    db.prepare(`UPDATE orders SET provider_status=?, remains=?, status=COALESCE(?, status) WHERE id=?`)
      .run(String(st.status ?? ''), remains, fin ?? null, o.id);
    return db.prepare('SELECT * FROM orders WHERE id=?').get(o.id);
  } catch { return o; } // provider hiccup: keep what we have
}

let syncing = false;
export async function syncAll() {
  if (syncing) return;
  syncing = true;
  try {
    const rows = db.prepare(`SELECT * FROM orders WHERE status='processing' ORDER BY id LIMIT 100`).all();
    for (const o of rows) await syncOrder(o);
  } finally { syncing = false; }
}

// Background sync so finished / canceled orders show up even if nobody opens them.
export function startOrderSync(everyMs = 5 * 60_000) {
  return setInterval(() => syncAll().catch((e) => console.error('sync failed:', e.message)), everyMs);
}
