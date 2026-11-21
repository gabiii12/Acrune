// Admin API: login, order review (approve/reject/refund/cancel), screenshots and service margins.
import express from 'express';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { providers, getProvider } from '../providers.js';
import { checkPassword, issueToken, requireAdmin } from '../middleware/auth.js';
import { getServices, orderable, toAdmin } from '../services/catalog.js';
import { syncAll, syncOrder } from '../services/orderSync.js';
import { screenshotPath, deleteScreenshot } from '../services/uploads.js';
import { round } from '../utils.js';

export const adminRouter = express.Router();
adminRouter.use(express.json({ limit: '20kb' }));

const findById = (id) => db.prepare('SELECT * FROM orders WHERE id=?').get(id);

// ---- login (the only route that doesn't need a token) ----
adminRouter.post('/login', rateLimit({ windowMs: 15 * 60_000, limit: 20 }), (req, res) => {
  const result = checkPassword(req.body?.password);
  if (result === 'not_configured')
    return res.status(503).json({ error: 'Set a real ADMIN_PASSWORD (8+ characters) in server/.env and restart the server' });
  if (result !== 'ok') return res.status(401).json({ error: 'Wrong password' });
  res.json({ token: issueToken() });
});

adminRouter.use(requireAdmin);

// ---- dashboard data ----
adminRouter.get('/orders', async (_req, res) => {
  syncAll().catch(() => {}); // refresh delivery statuses in the background
  const balances = await Promise.all(providers.map(async (p) => {
    try { const b = await p.balance(); return { provider: p.id, balance: b.balance, currency: b.currency }; }
    catch (e) { return { provider: p.id, error: e.message }; }
  }));
  res.json({ balances, orders: db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 500').all() });
});

// Service list with provider, your cost and your price (per 1000, PHP).
adminRouter.get('/services', async (_req, res) => {
  try {
    res.json((await getServices()).filter(orderable).map(toAdmin));
  } catch (e) { res.status(502).json({ error: e.message }); }
});

// ---- order actions ----
adminRouter.post('/orders/:id/approve', async (req, res) => {
  const o = findById(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  const p = getProvider(o.provider);
  if (!p) return res.status(400).json({ error: `Provider "${o.provider}" is not configured` });
  if (o.status !== 'payment_submitted') return res.status(409).json({ error: 'Order not awaiting approval' });

  // Guard against losing money if the provider raised its price after the customer ordered.
  if (!req.body?.force) {
    const s = (await getServices().catch(() => [])).find((x) => x.sid === `${o.provider}:${o.service_id}`);
    const cost = s ? round((s.cost / 1000) * o.quantity, 2) : null;
    if (cost !== null && cost > o.price + 0.01)
      return res.status(409).json({ code: 'price_up',
        error: `Provider now charges ₱${cost.toFixed(2)} but the customer paid ₱${o.price.toFixed(2)}.` });
  }

  // Claim first so a double-click cannot place the order twice.
  const claim = db.prepare(`UPDATE orders SET status='approving' WHERE id=? AND status='payment_submitted'`).run(o.id);
  if (!claim.changes) return res.status(409).json({ error: 'Order not awaiting approval' });
  try {
    const r = await p.add(o.service_id, o.link, o.quantity);
    if (!r?.order) throw new Error('provider did not return an order id');
    db.prepare(`UPDATE orders SET status='processing', zsmm_order_id=?, note=NULL WHERE id=?`).run(String(r.order), o.id);
    res.json({ ok: true, provider_order_id: r.order });
  } catch (e) {
    db.prepare(`UPDATE orders SET status='payment_submitted', note=? WHERE id=?`).run(`Provider error: ${e.message}`, o.id);
    res.status(502).json({ error: e.message });
  }
});

adminRouter.post('/orders/:id/reject', (req, res) => {
  const note = String(req.body?.note ?? '').slice(0, 300).trim() || 'Payment could not be verified';
  const r = db.prepare(`UPDATE orders SET status='rejected', note=?
                        WHERE id=? AND status IN ('payment_submitted','awaiting_payment')`).run(note, req.params.id);
  if (!r.changes) return res.status(409).json({ error: 'Order can no longer be rejected' });
  res.json({ ok: true });
});

// Ask the provider to cancel a running order. If it works, the status sync marks it
// canceled/partial and it shows up under "Needs refund".
adminRouter.post('/orders/:id/provider-cancel', async (req, res) => {
  const o = findById(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  const p = getProvider(o.provider);
  if (o.status !== 'processing' || !o.zsmm_order_id || !p)
    return res.status(409).json({ error: 'Only orders in progress can be canceled at the provider' });
  try {
    const r = await p.cancel(o.zsmm_order_id);
    const item = Array.isArray(r) ? r[0] : r;
    const bad = item?.error || item?.cancel?.error;
    if (bad) throw new Error(typeof bad === 'string' ? bad : JSON.stringify(bad));
    db.prepare(`UPDATE orders SET note='Cancel requested at provider' WHERE id=?`).run(o.id);
    await syncOrder(findById(o.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(502).json({ error: `Provider refused to cancel: ${e.message.replace(/^\w+: /, '')}` });
  }
});

// Mark a canceled/partial order as refunded after you send the customer their money back.
adminRouter.post('/orders/:id/refunded', (req, res) => {
  const note = String(req.body?.note ?? '').slice(0, 300).trim() || 'Refunded';
  const o = db.prepare(`SELECT * FROM orders WHERE id=? AND status IN ('canceled','partial')`).get(req.params.id);
  if (!o) return res.status(409).json({ error: 'Only canceled or partial orders can be marked refunded' });
  // Customer canceled and got their money back: erase the order and its screenshot.
  if (o.customer_canceled) {
    db.prepare('DELETE FROM orders WHERE id=?').run(o.id);
    deleteScreenshot(o.payment_proof);
    return res.json({ ok: true, erased: true });
  }
  db.prepare(`UPDATE orders SET status='refunded', note=? WHERE id=?`).run(note, o.id);
  res.json({ ok: true, erased: false });
});

// The customer's payment screenshot.
adminRouter.get('/orders/:id/proof', (req, res) => {
  const file = screenshotPath(findById(req.params.id)?.payment_proof);
  if (!file) return res.status(404).json({ error: 'No screenshot' });
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' });
  res.sendFile(file);
});
