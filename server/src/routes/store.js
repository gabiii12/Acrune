// Customer-facing API: services, placing orders, paying, tracking and canceling.
import crypto from 'node:crypto';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { db } from '../db.js';
import { getServices, findService, orderable, toPublic } from '../services/catalog.js';
import { syncOrder } from '../services/orderSync.js';
import { parseScreenshot, saveScreenshot, deleteScreenshot } from '../services/uploads.js';
import { round } from '../utils.js';

export const storeRouter = express.Router();

const perMinute = (limit) => rateLimit({ windowMs: 60_000, limit });
const findByToken = (token) => db.prepare('SELECT * FROM orders WHERE token=?').get(token);

// What a customer may see about their order (no contact, payment ref or provider details).
const toCustomerView = (o) => ({
  token: o.token, service: o.service_name, link: o.link, quantity: o.quantity,
  price: o.price, status: o.status, note: o.note, created_at: o.created_at,
  progress: o.provider_status ? { status: o.provider_status, remains: o.remains } : undefined,
});

storeRouter.get('/config', (_req, res) =>
  res.json({ gcashNumber: config.gcash.number, gcashName: config.gcash.name }));

storeRouter.get('/services', async (_req, res) => {
  try {
    res.json((await getServices()).filter(orderable).map(toPublic));
  } catch (e) { res.status(502).json({ error: e.message }); }
});

storeRouter.post('/orders', express.json({ limit: '20kb' }), perMinute(10), async (req, res) => {
  try {
    const { serviceId, link, quantity, contact } = req.body ?? {};
    const s = await findService(String(serviceId));
    const qty = Number(quantity);
    if (!s) return res.status(400).json({ error: 'Unknown service' });
    if (!Number.isInteger(qty) || qty < s.min || qty > s.max)
      return res.status(400).json({ error: `Quantity must be ${s.min}-${s.max}` });
    if (typeof link !== 'string' || !/^https?:\/\/\S+$/i.test(link.trim()))
      return res.status(400).json({ error: 'Enter a valid link starting with http(s)://' });
    if (typeof contact !== 'string' || contact.trim().length < 3)
      return res.status(400).json({ error: 'Contact (email/Telegram/Facebook) required' });

    // Rates are per 1000 units. Price is always computed server-side.
    const price = round((s.rate / 1000) * qty, 2);
    const token = crypto.randomBytes(12).toString('hex');
    db.prepare(`INSERT INTO orders (token, provider, service_id, service_name, link, quantity, price, contact)
                VALUES (?,?,?,?,?,?,?,?)`)
      .run(token, s.provider, s.pid, s.name, link.trim(), qty, price, contact.trim().slice(0, 200));
    res.json({ token, price });
  } catch (e) { res.status(502).json({ error: e.message }); }
});

storeRouter.get('/orders/:token', perMinute(60), async (req, res) => {
  const o = findByToken(req.params.token);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  res.json(toCustomerView(await syncOrder(o)));
});

// The only route with a large body: it carries the receipt screenshot.
storeRouter.post('/orders/:token/payment', perMinute(10), express.json({ limit: '4mb' }), (req, res) => {
  const ref = String(req.body?.reference ?? '').trim();
  if (!/^[A-Za-z0-9 -]{6,30}$/.test(ref))
    return res.status(400).json({ error: 'Enter the GCash reference number' });
  const shot = parseScreenshot(req.body?.screenshot);
  if (shot.error) return res.status(400).json({ error: shot.error });

  const o = findByToken(req.params.token);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  if (o.status !== 'awaiting_payment')
    return res.status(400).json({ error: o.status === 'customer_canceled' ? 'This order was canceled. Please place a new order.' : 'Payment already submitted' });

  const file = saveScreenshot(o.id, shot);
  try {
    const r = db.prepare(`UPDATE orders SET payment_ref=?, payment_proof=?, status='payment_submitted'
                          WHERE id=? AND status='awaiting_payment'`).run(ref, file, o.id);
    if (!r.changes) throw new Error('race');
  } catch (e) {
    deleteScreenshot(file);
    return res.status(400).json({ error: e.message === 'race' ? 'Payment already submitted' : 'That reference number was already used' });
  }
  res.json({ ok: true });
});

// Customer cancels their own order. Only possible before we send it to the provider.
storeRouter.post('/orders/:token/cancel', perMinute(10), (req, res) => {
  const o = findByToken(req.params.token);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  // Not paid yet: erase it completely.
  let r = db.prepare(`DELETE FROM orders WHERE id=? AND status='awaiting_payment'`).run(o.id);
  if (r.changes) return res.json({ ok: true, erased: true });
  // Paid but not approved: keep it until the admin refunds, then it is erased (see admin /refunded).
  r = db.prepare(`UPDATE orders SET status='canceled', customer_canceled=1,
                  note='Canceled by customer before approval. Refund the full amount.'
                  WHERE id=? AND status='payment_submitted'`).run(o.id);
  if (!r.changes)
    return res.status(409).json({ error: ['canceled', 'refunded', 'rejected'].includes(o.status)
      ? 'This order is already closed.'
      : 'This order has already started and can no longer be canceled here. Please contact us.' });
  res.json({ ok: true, erased: false });
});
